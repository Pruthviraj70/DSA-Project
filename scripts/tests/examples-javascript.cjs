const fs=require('node:fs'),vm=require('node:vm');
const tests=`
const assert=(x)=>{if(!x)throw Error('Example assertion failed');};
const a=[3,1,3,-2];assert(arrayAccess(a,0)===3);const created=arrayCreate(a);created[0]=99;assert(a[0]===3);arrayUpdate(a,1,7);arrayInsert(a,0,9);assert(arrayDelete(a,0)===9);assert(arrayInsertCopy(a,4,10).length===5&&a.length===4);
for(const sort of [insertionSort,mergeSort,mergeSortRecursive,quickSort]){const b=[3,1,3,-2];sort(b);assert(JSON.stringify(b)==='[-2,1,3,3]');assert(binarySearch(b,1)===1&&binarySearchRecursive(b,1)===1&&binaryFirst(b,3)===2&&linearSearch(b,8)===-1);const empty=[];sort(empty);assert(empty.length===0);}
assert(binarySearch([],1)===-1);
let head=listInsert(null,0,4);head=listInsert(head,1,9);assert(listSearch(head,9).value===9);head=listDelete(head,0);assert(head.value===9);
const stack=[],queue=[];stackPush(stack,2);stackPush(stack,3);assert(stackPeek(stack)===3&&stackPop(stack)===3);queueEnqueue(queue,2);queueEnqueue(queue,3);assert(queueInspect(queue)===2&&queueDequeue(queue)===2);
let underflow=false;try{stackPop([]);}catch{underflow=true;}assert(underflow);
const ring=new CircularQueue();for(let i=0;i<70;i++){circularEnqueue(ring,i);assert(circularDequeue(ring)===i);}
let root=null;for(const v of [10,5,20,15,17,10])root=bstInsert(root,v);root=bstDelete(root,10);assert(!bstSearch(root,10)&&bstSearch(root,17));root=bstDelete(root,20);root=bstDelete(root,5);
const g=graphCreate(4);graphSetEdge(g,0,1,0);graphSetEdge(g,1,2,3);assert(JSON.stringify(bfs(g,0))==='[0,1,2]'&&dfs(g,0).length===3);const d=dijkstra(g,0);assert(d[2]===3&&d[3]===Infinity);graphSetEdge(g,2,3,-1);let rejected=false;try{dijkstra(g,0);}catch{rejected=true;}assert(rejected);graphRemoveVertex(g,1);assert(graphAddVertex(g)===3&&!g.has[3][2]);
countdown(5);console.log('JavaScript example behavior passed');`;
vm.runInNewContext(fs.readFileSync('content/examples/examples.js','utf8')+tests,{console});
