#include "engine.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
static void setup(int op,int n,int arg,int index){assert(engine_config(ARRAY,op,n,arg,index,0));for(int i=0;i<n;i++)assert(engine_value(i,i+1));assert(engine_start());}
static const char *finish(void){int count=0;while(engine_next()){assert(++count<=HISTORY_LIMIT);}assert(!engine_error()[0]);return engine_state();}
int main(void){
 setup(3,3,9,1);assert(strstr(finish(),"\"data\":[1,9,2,3]"));
 setup(4,3,0,0);assert(strstr(finish(),"\"data\":[2,3]"));
 setup(2,1,8,0);assert(strstr(finish(),"\"data\":[8]"));
 setup(0,0,0,0);assert(strstr(finish(),"\"data\":[]"));
 assert(engine_config(ARRAY,1,0,0,0,0));assert(!engine_start());
 engine_free();puts("Native vertical slice: 5 cases passed");
}
