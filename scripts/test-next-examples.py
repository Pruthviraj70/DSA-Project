"""Execute every new example in all five toolchains; independent expected outputs."""
import json,pathlib,tempfile,subprocess,os
ROOT=pathlib.Path(__file__).resolve().parent.parent
bank=json.loads((ROOT/'content/examples.json').read_text());meta=json.loads((ROOT/'content/examples/next/metadata.json').read_text())
checks={
 'rec-factorial':('factorial(12)==479001600','factorial(12)==479001600','factorial(12)==479001600','factorial(12)==479001600','factorial(12)===479001600'),
 'rec-fibonacci':('fibonacci(10)==55','fibonacci(10)==55','fibonacci(10)==55','fibonacci(10)==55','fibonacci(10)===55'),
 'rec-sum':('int a[]={2,-1,4}; assert(prefix_sum(a,3)==5);','std::vector<int>a{2,-1,4}; assert(prefixSum(a,3)==5);','int[] a={2,-1,4}; assert prefixSum(a,3)==5;','assert prefix_sum([2,-1,4],3)==5','assert.equal(prefixSum([2,-1,4],3),5);'),
 'rec-binary':('int a[]={1,3,5}; assert(recursive_search(a,0,2,3)==1);assert(recursive_search(a,0,-1,8)==-1);','std::vector<int>a{1,3,5};assert(recursiveSearch(a,0,2,3)==1);','int[] a={1,3,5};assert recursiveSearch(a,0,2,3)==1;','assert recursive_search([1,3,5],0,2,3)==1','assert.equal(recursiveSearch([1,3,5],0,2,3),1);'),
 'two-pair':('int a[]={-100000,100000};Pair p=pair_sum(a,2,0);assert(p.left==0&&p.right==1);','std::vector<int>a{-100000,100000};assert(pairSum(a,0).second==1);','int[]a={-100000,100000};assert pairSum(a,0).right()==1;','assert pair_sum([-100000,100000],0)==(0,1)','assert.deepEqual(pairSum([-100000,100000],0),[0,1]);'),
 'two-reverse':('int a[]={1,2,3};reverse_values(a,3);assert(a[0]==3&&a[2]==1);','std::vector<int>a{1,2,3};reverseValues(a);assert(a[0]==3&&a[2]==1);','int[]a={1,2,3};reverseValues(a);assert a[0]==3&&a[2]==1;','a=[1,2,3]\nreverse_values(a)\nassert a==[3,2,1]','const a=[1,2,3];reverseValues(a);assert.deepEqual(a,[3,2,1]);'),
 'two-unique':('int a[]={1,1,2,2,4};assert(unique_prefix(a,5)==3);assert(a[0]==1&&a[1]==2&&a[2]==4);','std::vector<int>a{1,1,2,2,4};assert(uniquePrefix(a)==3&&a[2]==4);','int[]a={1,1,2,2,4};assert uniquePrefix(a)==3&&a[2]==4;','a=[1,1,2,2,4]\nassert unique_prefix(a)==3 and a[:3]==[1,2,4]','const a=[1,1,2,2,4];assert.equal(uniquePrefix(a),3);assert.deepEqual(a.slice(0,3),[1,2,4]);'),
 'window-fixed':('int a[]={-5,-2,-8};Window r=fixed_window(a,3,2);assert(r.sum==-7&&r.start==0);','std::vector<int>a{-5,-2,-8};assert(fixedWindow(a,2).first==-7);','int[]a={-5,-2,-8};assert fixedWindow(a,2).sum()==-7;','assert fixed_window([-5,-2,-8],2)==(-7,0)','assert.deepEqual(fixedWindow([-5,-2,-8],2),[-7,0]);'),
 'window-variable':('int a[]={0,0,5};Shortest r=minimum_window(a,3,5);assert(r.length==1&&r.start==2);assert(minimum_window(a,0,5).length==0);','std::vector<int>a{0,0,5};assert(minimumWindow(a,5).first==1);assert(minimumWindow(a,9).first==0);','int[]a={0,0,5};assert minimumWindow(a,5).length()==1;assert minimumWindow(a,9).length()==0;','assert minimum_window([0,0,5],5)==(1,2)\nassert minimum_window([],5)==(0,-1)','assert.deepEqual(minimumWindow([0,0,5],5),[1,2]);assert.deepEqual(minimumWindow([],5),[0,-1]);'),
}
# Heap behavior uses the same ordering contracts, without a library heap implementation.
for id in ['heap-build','heap-insert','heap-extract','heap-peek','heap-sort']:
 c='int a[32]={8,3,7,1,5};int n=5;heap_build(a,n,false);assert(a[0]==1);'
 cpp='std::vector<int>a{8,3,7,1,5};heapBuild(a,false);assert(a[0]==1);'
 java='int[]a=new int[32];int[]v={8,3,7,1,5};System.arraycopy(v,0,a,0,5);int n=5;heapBuild(a,n,false);assert a[0]==1;'
 py='a=[8,3,7,1,5]\nheap_build(a)\nassert a[0]==1\n'
 js='const a=[8,3,7,1,5];heapBuild(a);assert.equal(a[0],1);'
 if id=='heap-insert':c+='assert(heap_insert(a,&n,32,0,false)&&a[0]==0&&n==6);';cpp+='heapInsert(a,0);assert(a[0]==0);';java+='n=heapInsert(a,n,0,false);assert a[0]==0&&n==6;';py+='heap_insert(a,0)\nassert a[0]==0';js+='heapInsert(a,0);assert.equal(a[0],0);'
 if id=='heap-extract':c+='int out;assert(heap_extract(a,&n,false,&out)&&out==1&&n==4&&a[0]==3);';cpp+='assert(heapExtract(a)==1&&a[0]==3);';java+='Removal r=heapExtract(a,n,false);assert r.value()==1&&r.length()==4&&a[0]==3;';py+='assert heap_extract(a)==1 and a[0]==3';js+='assert.equal(heapExtract(a),1);assert.equal(a[0],3);'
 if id=='heap-peek':c+='int out;assert(heap_peek(a,n,&out)&&out==1&&n==5);';cpp+='assert(heapPeek(a)==1&&a.size()==5);';java+='assert heapPeek(a,n)==1;';py+='assert heap_peek(a)==1 and len(a)==5';js+='assert.equal(heapPeek(a),1);assert.equal(a.length,5);'
 if id=='heap-sort':c+='heap_sort(a,n);for(int i=1;i<n;i++)assert(a[i-1]<=a[i]);';cpp+='heapSort(a);for(int i=1;i<5;i++)assert(a[i-1]<=a[i]);';java+='int[]b={8,3,7,1,5};heapSort(b);for(int i=1;i<5;i++)assert b[i-1]<=b[i];';py+='heap_sort(a)\nassert a==[1,3,5,7,8]';js+='heapSort(a);assert.deepEqual(a,[1,3,5,7,8]);'
 checks[id]=(c,cpp,java,py,js)
for id in ['hash-chain','hash-probe']:
 c='HashTable t;'+('assert(map_init(&t));' if id=='hash-chain' else 'map_init(&t);')+'assert(map_put(&t,-8,1));assert(map_put(&t,0,2));assert(map_put(&t,8,3));assert(map_delete(&t,0));int v;assert(map_get(&t,8,&v)&&v==3);assert(!map_get(&t,0,&v));assert(map_put(&t,-8,99));assert(map_get(&t,-8,&v)&&v==99);assert(map_rehash(&t));assert(map_get(&t,8,&v)&&v==3);'+('map_free(&t);' if id=='hash-chain' else '')
 cpp='HashTable t;t.put(-8,1);t.put(0,2);t.put(8,3);assert(t.erase(0));assert(t.get(8)==3);assert(!t.get(0));t.put(-8,99);assert(t.size()==2&&t.get(-8)==99);t.rehash();assert(t.get(8)==3);'
 java='HashTable t=new HashTable();t.put(-8,1);t.put(0,2);t.put(8,3);assert t.delete(0);assert t.get(8)==3;assert t.get(0)==null;t.put(-8,99);assert t.size==2&&t.get(-8)==99;t.rehash();assert t.get(8)==3;'
 py='t=HashTable()\nt.put(-8,1)\nt.put(0,2)\nt.put(8,3)\nassert t.delete(0)\nassert t.get(8)==3 and t.get(0) is None\nt.put(-8,99)\nassert t.size==2 and t.get(-8)==99\nt.rehash()\nassert t.get(8)==3'
 js='const t=new HashTable();t.put(-8,1);t.put(0,2);t.put(8,3);assert(t.delete(0));assert.equal(t.get(8),3);assert.equal(t.get(0),null);t.put(-8,99);assert.equal(t.size,2);assert.equal(t.get(-8),99);t.rehash();assert.equal(t.get(8),3);'
 checks[id]=(c,cpp,java,py,js)
assert set(checks)==set(meta)
def run(args):
 result=subprocess.run(args,cwd=ROOT,stdout=subprocess.PIPE,stderr=subprocess.PIPE)
 if result.returncode:raise RuntimeError(' '.join(map(str,args))+'\n'+result.stdout.decode()+result.stderr.decode())
java_home=pathlib.Path(os.environ['JAVA_HOME'])
with tempfile.TemporaryDirectory(prefix='dsa-next-example-') as tmp:
 tmp=pathlib.Path(tmp)
 for id,tests in checks.items():
  for i,lang in enumerate(['C','C++','Java','Python','JavaScript']):
   code=bank[id]['codes'][lang];test=tests[i]
   if id in ['rec-factorial','rec-fibonacci']:test= ('assert '+test+';' if lang=='Java' else 'assert('+test+');' if lang in ['C','C++','JavaScript'] else 'assert '+test)
   try:
    if lang in ['C','C++']:
     f=tmp/('check.c' if lang=='C' else 'check.cpp');f.write_text(('#include <assert.h>\n' if lang=='C' else '#include <cassert>\n')+code+'\nint main(void){'+test+'return 0;}')
     run(['gcc' if lang=='C' else 'g++','-std=c17' if lang=='C' else '-std=c++17','-Wall','-Wextra','-Werror','-fsanitize=address,undefined',str(f),'-o',str(tmp/'check')]);run([str(tmp/'check')])
    elif lang=='Java':
     f=tmp/'Example.java';before=code.rsplit('}',1)[0];f.write_text(before+'\npublic static void main(String[] args){'+test+'}\n}')
     run([str(java_home/'bin/javac'),'-d',str(tmp),str(f)]);run([str(java_home/'bin/java'),'-ea','-cp',str(tmp),'Example'])
    elif lang=='Python':exec(code+'\n'+test,{})
    else:
     f=tmp/'check.cjs';f.write_text("const assert=require('node:assert/strict');\n"+code+'\n'+test);run(['node',str(f)])
   except Exception as error:raise RuntimeError(f'{id}/{lang}: {error}') from error
print(f'{len(checks)*5} new example executions passed across five languages')
