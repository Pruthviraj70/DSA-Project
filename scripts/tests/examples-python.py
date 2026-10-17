import runpy,pathlib
scope=runpy.run_path(str(pathlib.Path(__file__).resolve().parents[2]/'content/examples/examples.py'))
globals().update(scope)
a=[3,1,3,-2];assert array_access(a,0)==3
created=array_create(a);created[0]=99;assert a[0]==3
array_update(a,1,7);array_insert(a,0,9);assert array_delete(a,0)==9
assert len(array_insert_copy(a,4,10))==5 and len(a)==4
for sort in [insertion_sort,merge_sort,merge_sort_recursive,quick_sort]:
    b=[3,1,3,-2];sort(b);assert b==[-2,1,3,3]
    assert binary_search(b,1)==1 and binary_search_recursive(b,1)==1 and binary_first(b,3)==2 and linear_search(b,8)==-1
    empty=[];sort(empty);assert empty==[]
assert binary_search([],1)==-1
head=list_insert(None,0,4);head=list_insert(head,1,9);assert list_search(head,9).value==9
head=list_delete(head,0);assert head.value==9
stack=[];queue=[];stack_push(stack,2);stack_push(stack,3);assert stack_peek(stack)==3 and stack_pop(stack)==3
queue_enqueue(queue,2);queue_enqueue(queue,3);assert queue_inspect(queue)==2 and queue_dequeue(queue)==2
try:stack_pop([]);assert False
except IndexError:pass
ring=CircularQueue()
for i in range(70):circular_enqueue(ring,i);assert circular_dequeue(ring)==i
root=None
for v in [10,5,20,15,17,10]:root=bst_insert(root,v)
root=bst_delete(root,10);assert bst_search(root,10) is None and bst_search(root,17)
root=bst_delete(root,20);root=bst_delete(root,5)
g=graph_create(4);graph_set_edge(g,0,1,0);graph_set_edge(g,1,2,3)
assert bfs(g,0)==[0,1,2] and len(dfs(g,0))==3
d=dijkstra(g,0);assert d[2]==3 and d[3]==float('inf')
graph_set_edge(g,2,3,-1)
try:dijkstra(g,0);assert False
except ValueError:pass
graph_remove_vertex(g,1);assert graph_add_vertex(g)==3 and not g.has[3][2]
countdown(5);print('Python example behavior passed')
