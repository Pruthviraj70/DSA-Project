#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
#include "../src/engine.c"
static unsigned seed=97;
static int random_value(void){seed=1664525u*seed+1013904223u;return (int)(seed%201)-100;}
static int ints(const void*a,const void*b){int x=*(const int*)a,y=*(const int*)b;return (x>y)-(x<y);}
static void begin(int module,int op,int n,int arg,int index,const int *values){assert(engine_config(module,op,n,arg,index,0));for(int i=0;i<n;i++)assert(engine_value(i,values[i]));assert(engine_start());}
static void finish(void){int steps=0;while(engine_next())assert(++steps<HISTORY_LIMIT);assert(!engine_error()[0]);assert(e.done);}
int main(void){int cases=0;
 for(int n=0;n<=32;n++)for(int trial=0;trial<8;trial++)for(int op=0;op<=8;op++){
  if((!n&&(op==3||op==4||op==6||op==7))||(n==32&&(op==2||op==5)))continue;
  int values[33],sorted[33];for(int i=0;i<n;i++)values[i]=sorted[i]=random_value();qsort(sorted,n,sizeof(int),ints);
  begin(HEAP,op,n,-103,0,values);finish();
  if(op==8){for(int i=0;i<n;i++)assert(e.data[i]==sorted[i]);}
  else{int maximum=op==1||op==5||op==6||op==7;for(int i=1;i<e.n;i++)assert(maximum?e.data[(i-1)/2]>=e.data[i]:e.data[(i-1)/2]<=e.data[i]);
   if(op==2||op==5)assert(e.n==n+1);
   if(op==3||op==6){assert(e.n==n-1);assert(e.next.result==(maximum?sorted[n-1]:sorted[0]));}
   if(op==4||op==7)assert(e.next.result==(maximum?sorted[n-1]:sorted[0]));
  }
  cases++;engine_free();assert(!e.next.depth&&!e.n);
 }
 printf("Next C: %d heap cases passed\n",cases);
}
