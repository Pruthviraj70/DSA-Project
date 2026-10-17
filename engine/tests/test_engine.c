/* Include the unmodified portable implementation to inspect invariants in native tests. */
#include "../src/engine.c"
#include <assert.h>
#include <stdlib.h>
static int cases;
static unsigned rng=1729;
static int random_value(void){rng=rng*1664525u+1013904223u;return (int)(rng%21)-10;}
static int cmp(const void *a,const void *b){int x=*(const int*)a,y=*(const int*)b;return (x>y)-(x<y);}
static void config(int module,int op,const int *values,int n,int arg,int index){
 assert(engine_config(module,op,n,arg,index,0));for(int i=0;i<n;i++)assert(engine_value(i,values[i]));
}
static void finish(void){
 int count=0;while(engine_next()){assert(++count<HISTORY_LIMIT);assert(e.seq==count);assert(strlen(engine_state())<sizeof json-1);}
 assert(e.done);assert(!engine_error()[0]);cases++;
}
static void run(int module,int op,const int *values,int n,int arg,int index){config(module,op,values,n,arg,index);assert(engine_start());finish();}
static int validate_tree(int id,int low,int high,int *count){
 if(!id)return 1;assert(id>0&&id<=e.node_count);Node node=e.nodes[id];assert(node.active&&node.value>low&&node.value<high);(*count)++;
 assert(*count<=LIMIT);return validate_tree(node.left,low,node.value,count)&&validate_tree(node.right,node.value,high,count);
}
static void tree_size(int expected){int count=0;assert(validate_tree(e.root,INT_MIN,INT_MAX,&count));assert(count==expected);}
int main(void){
 int v[]={1,2,3};
 run(ARRAY,3,v,3,9,1);assert(e.n==4&&e.data[1]==9&&e.data[3]==3);
 run(ARRAY,4,v,3,0,0);assert(e.n==2&&e.data[0]==2);
 run(ARRAY,2,v,3,8,0);assert(e.data[0]==8);run(ARRAY,1,v,3,0,2);assert(e.value==3);
 run(ARRAY,0,v,0,0,0);assert(e.n==0);
 config(ARRAY,1,v,0,0,0);assert(!engine_start());cases++;
 for(int module=INSERTION;module<=QUICK;module++)for(int trial=0;trial<500;trial++){
  int values[LIMIT],expected[LIMIT];int n=trial%(LIMIT+1);for(int i=0;i<n;i++)values[i]=expected[i]=random_value();qsort(expected,(size_t)n,sizeof(int),cmp);
  run(module,0,values,n,0,0);assert(e.n==n&&!memcmp(e.data,expected,(size_t)n*sizeof(int)));
 }
 int dup[]={1,2,2,4};run(LINEAR,0,dup,4,2,0);assert(e.found==1);run(BINARY,0,dup,4,2,0);assert(e.found>=1&&e.found<=2);
 run(LINEAR,0,dup,0,2,0);assert(e.found==-1);run(BINARY,0,dup,4,3,0);assert(e.found==-1);
 int unsorted[]={2,1};config(BINARY,0,unsorted,2,1,0);assert(!engine_start());cases++;
 run(LIST,0,v,3,7,1);assert(e.n==4&&e.data[1]==7&&e.nodes[1].next==4&&e.nodes[4].next==2);
 run(LIST,0,v,0,7,0);assert(e.head==1&&e.n==1);run(LIST,1,v,3,0,0);assert(e.head==2&&e.n==2);
 run(LIST,1,v,3,0,2);assert(e.nodes[2].next==0&&e.n==2);run(LIST,2,dup,4,2,0);assert(e.found==2);run(LIST,3,v,3,0,0);assert(e.visits==3);
 run(STACK,0,v,3,9,0);assert(e.data[3]==9);run(STACK,1,v,3,0,0);assert(e.n==2&&e.value==3);run(STACK,2,v,3,0,0);assert(e.value==3&&e.n==3);
 run(QUEUE,0,v,3,9,0);assert(e.data[3]==9);run(QUEUE,1,v,3,0,0);assert(e.n==2&&e.data[0]==2);run(QUEUE,2,v,3,0,0);assert(e.value==1);
 for(int module=STACK;module<=QUEUE;module++){config(module,1,v,0,0,0);assert(!engine_start());cases++;}
 int tree[]={8,3,10,1,6,14,4,7,13};
 for(int i=0;i<9;i++){run(BST,2,tree,9,tree[i],0);tree_size(8);for(int j=1;j<=e.node_count;j++)if(e.nodes[j].active)assert(e.nodes[j].value!=tree[i]);}
 int single[]={5};run(BST,2,single,1,5,0);tree_size(0);int one_child[]={5,7};run(BST,2,one_child,2,5,0);tree_size(1);assert(e.nodes[e.root].value==7);
 run(BST,0,tree,9,6,0);tree_size(9);run(BST,0,tree,9,2,0);tree_size(10);run(BST,1,tree,9,6,0);assert(e.found>0);
 for(int mode=3;mode<=5;mode++){run(BST,mode,tree,9,0,0);assert(e.visits==9);if(mode==3){for(int i=1;i<e.order_n;i++)assert(e.nodes[e.order[i-1]].value<e.nodes[e.order[i]].value);}}
 for(int module=BFS;module<=DIJKSTRA;module++){
  int ids[]={1,4,7,9};config(module,0,ids,4,1,0);assert(engine_edge(0,1,0));assert(engine_edge(1,2,2));assert(engine_edge(0,2,9));assert(engine_start());finish();assert(e.visits==3);
  if(module==DIJKSTRA){assert(e.dist[0]==0&&e.dist[1]==0&&e.dist[2]==2&&e.dist[3]==INT_MAX);}
 }
 config(DIJKSTRA,0,v,3,1,0);assert(engine_edge(0,1,-1));assert(!engine_start());cases++;
 int ids[]={1,4,7};config(GRAPH,2,ids,3,4,0);assert(engine_edge(0,2,5));assert(engine_edge(1,2,6));assert(engine_start());finish();assert(e.n==2&&e.data[1]==7&&e.weight[0][1]==5);
 run(GRAPH,1,ids,3,9,0);assert(e.n==4&&e.data[3]==9);
 config(GRAPH,3,ids,3,7,1);assert(engine_graph_weight(8));assert(engine_start());finish();assert(e.edges[0][2]&&e.weight[2][0]==8);
 config(GRAPH,4,ids,3,7,1);assert(engine_edge(0,2,8));assert(engine_start());finish();assert(!e.edges[0][2]);
 /* Deterministic full protocol trace across a reset, including duplicates. */
 char trace[200000];size_t offset=0;config(QUICK,0,dup,4,0,0);assert(engine_start());const char *event;
 while((event=engine_next())){size_t n=strlen(event)+1;assert(offset+n<sizeof trace);memcpy(trace+offset,event,n);offset+=n;}
 config(QUICK,0,dup,4,0,0);assert(engine_start());offset=0;while((event=engine_next())){assert(!strcmp(event,trace+offset));offset+=strlen(event)+1;}cases++;
 /* Capacity and invalid module/operation checks. */
 int full[LIMIT];for(int i=0;i<LIMIT;i++)full[i]=i;
 for(int module=STACK;module<=QUEUE;module++){config(module,0,full,LIMIT,9,0);assert(!engine_start());cases++;}
 assert(!engine_config(99,0,0,0,0,0));assert(!engine_config(ARRAY,0,LIMIT+1,0,0,0));cases+=2;
 engine_free();assert(e.started==0&&e.node_count==0);printf("Native C: %d cases passed (randomized sorts, structures, BST deletion, graphs, reset, limits, cleanup)\n",cases);
}
