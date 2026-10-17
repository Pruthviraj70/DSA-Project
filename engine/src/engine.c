#include "engine.h"
#include <stdio.h>
#include <string.h>
#include <stdarg.h>
#include <limits.h>

typedef struct { int id,value,next,left,right,active; } Node;
typedef struct {
 int module,op,n,arg,index,directed,data[LIMIT],initial[LIMIT],edges[VERTICES][VERTICES],weight[VERTICES][VERTICES];
 int started,done,seq,a,b,value,found,i,j,k,phase;
 int root,head,tail,node_count; Node nodes[LIMIT+1];
 int compares,reads,writes,swaps,visits,mutations;
 int lo,hi,mid,width,start,left,right,end,temp[LIMIT],t;
 int ranges[LIMIT*2],sp,pivot,partition;
 int seen[VERTICES],frontier[VERTICES],front_n,dist[VERTICES],parent[VERTICES],current,neighbor;
 int order[LIMIT],order_n,cursor;
 char error[160]; const char *kind,*loc;
} Engine;
static Engine e;
static char json[32768]; static size_t used;
static int fail(const char *s) { snprintf(e.error,sizeof e.error,"%s",s); return 0; }
const char *engine_error(void) { return e.error; }
void engine_free(void) { memset(&e,0,sizeof e); }
int engine_config(int module,int operation,int count,int argument,int index,int directed) {
 engine_free(); e.module=module;e.op=operation;e.n=count;e.arg=argument;e.index=index;e.directed=directed;e.found=-1;
 if(module<ARRAY||module>DIJKSTRA) return fail("Unknown module");
 if(count<0||count>LIMIT||((module>=GRAPH)&&count>VERTICES)) return fail("Input exceeds module limit");
 if(argument < -100000 || argument > 100000) return fail("Argument must be between -100000 and 100000");
 if(directed!=0&&directed!=1) return fail("Direction must be 0 or 1");
 return 1;
}
int engine_value(int index,int value) {
 if(e.started||index<0||index>=e.n) return fail("Invalid input index");
 if(value < -100000 || value > 100000) return fail("Values must be between -100000 and 100000");
 e.data[index]=e.initial[index]=value; return 1;
}
int engine_edge(int from,int to,int weight) {
 if(e.started||e.module<GRAPH||from<0||to<0||from>=e.n||to>=e.n) return fail("Invalid graph endpoint");
 if(weight < -100000 || weight > 100000) return fail("Edge weight out of range");
 e.edges[from][to]=1;e.weight[from][to]=weight;
 if(!e.directed){ e.edges[to][from]=1;e.weight[to][from]=weight; } return 1;
}
static void append(const char *fmt,...) {
 va_list args;va_start(args,fmt);int n=vsnprintf(json+used,sizeof json-used,fmt,args);va_end(args);
 if(n<0||(size_t)n>=sizeof json-used){ used=sizeof json-1;return; } used+=(size_t)n;
}
static const char *snapshot(void) {
 used=0;append("{\"protocol\":1,\"seq\":%d,\"kind\":\"%s\",\"loc\":\"%s\",\"a\":%d,\"b\":%d,\"value\":%d,\"done\":%s,\"found\":%d,\"data\":[",e.seq,e.kind?e.kind:"ready",e.loc?e.loc:"engine.ready",e.a,e.b,e.value,e.done?"true":"false",e.found);
 for(int i=0;i<e.n;i++)append("%s%d",i?",":"",e.data[i]);append("],\"nodes\":[");
 int comma=0;for(int i=1;i<=e.node_count;i++){Node *n=&e.nodes[i];if(n->active){append("%s{\"id\":%d,\"value\":%d,\"next\":%d,\"left\":%d,\"right\":%d}",comma++?",":"",n->id,n->value,n->next,n->left,n->right);}}
 append("],\"root\":%d,\"head\":%d,\"edges\":[",e.root,e.head);comma=0;
 for(int i=0;i<e.n&&e.module>=GRAPH;i++)for(int j=0;j<e.n;j++)if(e.edges[i][j]&&(e.directed||i<=j))append("%s{\"id\":%d,\"from\":%d,\"to\":%d,\"weight\":%d}",comma++?",":"",e.data[i]*32+e.data[j],e.data[i],e.data[j],e.weight[i][j]);
 append("],\"dist\":[");for(int i=0;i<e.n&&e.module>=GRAPH;i++){if(e.dist[i]==INT_MAX)append("%snull",i?",":"");else append("%s%d",i?",":"",e.dist[i]);}
 append("],\"frontier\":[");for(int i=0;i<e.front_n;i++)append("%s%d",i?",":"",e.data[e.frontier[i]]);
 append("],\"counters\":{\"compare\":%d,\"read\":%d,\"write\":%d,\"swap\":%d,\"visit\":%d,\"mutation\":%d}}",e.compares,e.reads,e.writes,e.swaps,e.visits,e.mutations);return json;
}
const char *engine_state(void){return snapshot();}
static const char *emit(const char *kind,const char *loc,int a,int b,int value){
 e.kind=kind;e.loc=loc;e.a=a;e.b=b;e.value=value;e.seq++;
 if(!strcmp(kind,"compare"))e.compares++;else if(!strcmp(kind,"read"))e.reads++;else if(!strcmp(kind,"write"))e.writes++;else if(!strcmp(kind,"swap"))e.swaps++;else if(!strcmp(kind,"visit"))e.visits++;else if(strcmp(kind,"complete"))e.mutations++;
 return snapshot();
}
static const char *complete(void){e.done=1;return emit("complete","engine.complete",-1,-1,e.found);} /* @loc:engine.complete */
static const char *array_step(void){
 switch(e.op){
 case 0:return complete(); /* create */
 case 1: e.found=e.index;e.done=1;return emit("read","array.access",e.index,-1,e.data[e.index]); /* @loc:array.access */
 case 2: e.data[e.index]=e.arg;e.done=1;return emit("write","array.update",e.index,-1,e.arg); /* @loc:array.update */
 case 3:
  if(e.i>e.index){e.data[e.i]=e.data[e.i-1];e.i--;return emit("write","array.shift-right",e.i+1,e.i,e.data[e.i]);} /* @loc:array.shift-right */
  e.data[e.index]=e.arg;e.n++;e.done=1;return emit("insert","array.insert",e.index,-1,e.arg); /* @loc:array.insert */
 case 4:
  if(e.i<e.n-1){e.data[e.i]=e.data[e.i+1];e.i++;return emit("write","array.shift-left",e.i-1,e.i,e.data[e.i-1]);} /* @loc:array.shift-left */
  e.n--;e.done=1;return emit("delete","array.delete",e.index,-1,e.arg); /* @loc:array.delete */
 default:return complete();
 }
}
int engine_start(void){
 if(e.error[0])return 0;if(e.started)return fail("Engine already started");
 if(e.module==ARRAY){
  if(e.op<0||e.op>4)return fail("Invalid array operation");
  if((e.op==1||e.op==2||e.op==4)&&(e.index<0||e.index>=e.n))return fail("Index must address an existing element");
  if(e.op==3&&(e.index<0||e.index>e.n||e.n==LIMIT))return fail("Insert needs an index in 0..length and spare capacity");
  e.i=e.op==3?e.n:e.index;
 }else return fail("Module not yet implemented");
 e.started=1;e.kind="ready";e.loc="engine.ready";return 1; /* @loc:engine.ready */
}
const char *engine_next(void){
 if(!e.started||e.done||e.error[0])return NULL;
 if(e.seq>=HISTORY_LIMIT-1){fail("Event budget exhausted");return NULL;}
 return array_step();
}
