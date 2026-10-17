"""Extract standalone educational functions from tested source libraries (never execution-line maps)."""
import json,pathlib,re,textwrap
ROOT=pathlib.Path(__file__).resolve().parent.parent
FILES={'C':'examples.c','C++':'Examples.cpp','Java':'Examples.java','Python':'examples.py','JavaScript':'examples.js'}
def parts(path):
    text=path.read_text();marks=list(re.finditer(r'^[ \t]*(?:/\*|//|#)\s*(shared|example):([\w-]+).*$',text,re.M))
    end=re.search(r'^[ \t]*(?:/\*|//|#)\s*end\b.*$',text,re.M).start()
    headers=text[:marks[0].start()];result={}
    for i,m in enumerate(marks):result[m[1]+':'+m[2]]=textwrap.dedent(text[m.end():marks[i+1].start() if i+1<len(marks) else end]).strip()
    return headers,result
TITLE={
'array-create':'Create an independent sequence','countdown':'Recursive countdown','array-access':'Read one indexed value','array-update':'Replace one indexed value','array-traverse':'Visit each occupied value','array-insert':'Insert by shifting','array-insert-copy':'Insert into a new sequence','array-delete':'Delete and close the gap','linear-search':'Left-to-right linear search','binary-search':'Iterative binary search','binary-search-recursive':'Recursive binary search','binary-first':'First-occurrence binary search','insertion-sort':'Stable insertion sort','merge-sort':'Bottom-up merge sort','merge-sort-recursive':'Top-down merge sort','quick-sort':'Lomuto quicksort','list-insert':'Insert a linked node','list-delete':'Unlink a node','list-search':'Search linked values','list-traverse':'Follow the complete chain','stack-push':'Push to the top','stack-pop':'Remove the top','stack-peek':'Read the top','queue-enqueue':'Join the back','queue-dequeue':'Remove from the front','queue-inspect':'Read the front','circular-queue':'Circular-buffer queue','bst-insert':'Insert with strict ordering','bst-search':'Follow a search route','bst-delete':'Delete across all three cases','bst-inorder':'Left, node, right','bst-preorder':'Node, left, right','bst-postorder':'Left, right, node','graph-create':'Create and edit an adjacency matrix','bfs':'Breadth-first traversal with a matrix','bfs-list':'Breadth-first traversal with lists','dfs':'Explicit-path depth-first traversal','dijkstra':'Nonnegative weighted distances'}
ALT={'array-insert':['array-insert-copy'],'binary-search':['binary-search-recursive','binary-first'],'merge-sort':['merge-sort-recursive'],'bfs':['bfs-list']}
def group(id):
    if id=='array-create':return 'sequence'
    if id.startswith('list-'):return 'list'
    if id.startswith('bst-'):return 'tree'
    if id=='circular-queue':return 'circular'
    if id.startswith(('stack-','queue-')):return 'sequence'
    if id in ['graph-create','bfs','dfs','dijkstra']:return 'graph'

def metadata(id):
    pre=['Inputs are integer values; sequence size is at most 32 in these teaching examples.']
    notes=['These are complete example functions, not instructions highlighted as they execute.']
    time='O(n) worst-case time';space='O(1) auxiliary space'
    if id=='countdown':pre=['n is a nonnegative integer small enough for the language call stack.'];time='Theta(n) time';space='Theta(n) call-stack space'
    if id in ['array-access','array-update']:pre+=['0 <= index < logical length; invalid indices are explicitly rejected.'];time='O(1) time'
    if id=='array-create':time='Theta(n) copying work';space='Theta(n) output storage; C uses caller-provided fixed-capacity Sequence storage';notes+=['The result has independent storage. In C pass Sequence result = {0}; and supply the valid input count.']
    if id=='array-traverse':time='Theta(n) visits, excluding output-device time'
    if id.startswith('array-insert'):
        pre+=['0 <= index <= length. In-place insertion needs a spare slot.'];notes+=['C uses caller-provided storage and length. Other examples use growable collections and explicitly shift values; collection growth can allocate.','For Java in-place insertion, initialize ArrayList<Integer> values = new ArrayList<>(); capacity is passed separately.']
        if id.endswith('copy'):space='Theta(n) new/output storage; original input unchanged'
        else:space='O(1) explicit temporary storage when capacity is reserved; growable collections may allocate'
    if id=='array-delete':pre+=['The index must address an existing logical element; the removed value is preserved.']
    if id.startswith('binary'):
        pre+=['Input must already be sorted ascending. This precondition is not checked with a linear scan inside the function.'];time='O(log n) worst-case time';space='O(log n) recursive stack' if 'recursive' in id else 'O(1) auxiliary space';notes+=['An ordinary match may be any duplicate; first-occurrence search continues left after equality.']
    if id=='linear-search':notes+=['Returns the first matching index, or -1; empty input returns -1.']
    if 'sort' in id:
        notes+=['Values and duplicate counts are preserved. Empty and one-element inputs need no movement.']
        if id=='insertion-sort':time='Theta(n) best case; Theta(n²) worst case';notes+=['Strict > shifts preserve stability.']
        if id.startswith('merge-sort'):time='Theta(n log n) time';space='Theta(n) buffer plus O(log n) stack for the recursive alternative';notes+=['Choosing left on equal keys preserves stability.']
        if id=='quick-sort':time='Theta(n log n) for balanced partitions; Theta(n²) worst case';space='O(n) worst-case recursive stack';notes+=['This recursive example is not stable. The final-element pivot can be poor on ordered or equal inputs.']
    if id.startswith('list-'):
        pre=['Head is null/None or a finite acyclic singly linked chain. Positions are zero-based.'];notes+=['C/C++ examples can change the caller’s head. Java/Python/JavaScript insertion/deletion return the new head: assign it back.','C callers use list_free; C++ callers use listFree to release remaining owned nodes. Other languages manage unreachable objects.']
        if id=='list-insert':pre+=['Insertion permits index equal to length; allocation failure must not be ignored.']
        if id=='list-delete':pre+=['Deletion requires an existing node; do not lose its successor before repairing the chain.']
        if id=='list-search':notes+=['Returns the first matching node reference, not its stored value; null/None means missing.']
    if id.startswith(('stack-','queue-')) or id=='circular-queue':
        pre=['Initialize an empty collection; fixed capacity is 32. C uses Sequence stack = {0}; or Sequence queue = {0}; circular storage also starts with {0}.'];time='O(n) for shifting dequeue' if id=='queue-dequeue' else 'O(1) per operation with reserved storage';notes+=['Empty removals/reads report underflow separately from stored values. Growable collection allocation can add cost.']
    if id.startswith('bst-'):
        pre=['Root is null/None or a strict BST; duplicate inserts are ignored.'];time='O(h), where h is tree height';space='O(h) recursive stack; iterative search uses O(1)'
        notes+=['Always assign returned roots after insertion/deletion; C/C++ callers release remaining nodes with tree_free/treeFree.','C insertion can return null if allocation fails for an empty tree.']
        if id in ['bst-inorder','bst-preorder','bst-postorder']:time='Theta(n) visits, excluding output-device time'
        if id=='bst-delete':notes+=['This example copies the successor value and removes its old occurrence. Node identity differs from a relinking deletion.']
    if id in ['graph-create','bfs','bfs-list','dfs','dijkstra']:
        pre=['Use at most 16 vertices and integer weights between -100000 and 100000. Matrix examples use indices 0..V-1, distinct from diagram labels.']
        notes+=['Matrix presence and weight are separate, so zero weights are valid. Graph construction/setup is shown with the example.']
        time='O(V²) matrix work';space='O(V) traversal storage beyond the graph; the matrix itself is O(V²)'
        if id=='graph-create':space='O(V²) graph storage';notes+=['Removing a matrix vertex shifts indices. Diagram labels remain conceptual vertex identities.']
        if id=='dijkstra':pre+=['All present edges must be nonnegative; the function rejects negative weights before traversal.'];notes+=['Infinity means unreachable: INT_MAX in C, maximum int in C++/Java, infinity in Python/JavaScript. The stated graph limits prevent finite-distance integer overflow.']
        if id=='bfs-list':time='O(V+E) adjacency-list traversal';pre+=['All neighbor indices must be in range; C degree counts must be between 0 and V.'];notes+=['Adjacency-list setup: one neighbor collection per vertex; use outgoing neighbors for directed graphs.']
    return dict(preconditions=pre,notes=notes,time=time,space=space)
def build():
    parsed={lang:parts(ROOT/'content/examples'/file) for lang,file in FILES.items()};out={}
    for id,title in TITLE.items():
        codes={}
        for lang,(headers,sections) in parsed.items():
            shared=group(id);prefix=sections.get('shared:'+str(shared),'')
            # Graph traversals include their complete factory/edge setup, not an unstated earlier dependency.
            setup=sections['example:graph-create'] if shared=='graph' and id!='graph-create' else ''
            body='\n\n'.join(x for x in [prefix,sections['example:'+id],setup] if x)
            if lang=='Java':code=headers.replace('public class Examples','public class Example')+'\n'+textwrap.indent(body,'  ')+'\n}\n'
            else:code=headers+body+'\n'
            codes[lang]=code.strip()+'\n'
        out[id]=dict(id=id,title=title,alternatives=ALT.get(id,[]),codes=codes,**metadata(id))
    (ROOT/'content/examples.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
    print(f'Built {len(out)} standalone examples × {len(FILES)} languages')
if __name__=='__main__':build()
