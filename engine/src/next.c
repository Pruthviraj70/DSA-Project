/* Included inside engine.c: same C17 state machines in native and Wasm builds. */
static void next_snapshot(void) {
    NextState *x = &e.next;
    append(",\"extended\":{\"left\":%d,\"right\":%d,\"logical\":%d,\"extent\":%d,\"sum\":%lld,\"result\":%lld,\"best\":%d,\"capacity\":%d,\"size\":%d,\"bucket\":%d,\"probe\":%d,\"rehashing\":%s,\"slots\":[", x->left,x->right,x->logical,x->extent,x->sum,x->result,x->best,x->capacity,x->size,x->bucket,x->probe,x->rehash?"true":"false");
    for(int i=0;i<x->capacity;i++) append("%s{\"id\":%d,\"state\":%d,\"entry\":%d}",i?",":"",i,x->states[i],e.module==HASH_CHAIN?x->buckets[i]:x->slots[i]);
    append("],\"entries\":["); int comma=0;
    for(int i=1;i<=x->entries;i++) if(x->alive[i]) append("%s{\"id\":%d,\"key\":%d,\"value\":%d,\"next\":%d}",comma++?",":"",i,x->keys[i],x->values[i],x->links[i]);
    append("],\"frames\":[");
    for(int i=0;i<x->depth;i++){CallFrame *f=&x->frames[i];append("%s{\"id\":%d,\"parent\":%d,\"argument\":%d,\"lo\":%d,\"hi\":%d,\"phase\":%d,\"saved\":%lld}",i?",":"",f->id,f->parent,f->argument,f->lo,f->hi,f->phase,f->saved);}
    append("],\"calls\":[");
    for(int i=0;i<x->calls;i++){CallFrame *f=&x->tree[i];append("%s{\"id\":%d,\"parent\":%d,\"argument\":%d,\"returned\":%s,\"result\":%lld}",i?",":"",f->id,f->parent,f->argument,f->phase==9?"true":"false",f->result);}
    append("]}");
}
static int next_start(void) {
    NextState *x=&e.next; x->logical=e.n; x->right=e.n-1; x->best=-1;
    if(e.module==HEAP){
        if(e.op<0 || e.op>8) return fail("Choose a heap operation");
        if((e.op==2 || e.op==5) && e.n==LIMIT) return fail("Heap capacity is 32 values");
        if((e.op==3 || e.op==4 || e.op==6 || e.op==7) && !e.n) return fail("Cannot extract or peek at an empty heap");
        x->maximum=e.op==1 || e.op==5 || e.op==6 || e.op==7 || e.op==8;
        x->extent=e.n; x->build=e.n/2-1; x->heap_pos=-1;
    } else return fail("Module implementation unavailable");
    return 1;
}
static int heap_better(int a,int b){return e.next.maximum ? e.data[a]>e.data[b] : e.data[a]<e.data[b];}
static const char *heap_step(void) {
    NextState *x=&e.next;
    for(;;){
        /* Sift-down emits each child comparison separately before any swap. */
        if(x->phase==0){
            if(x->heap_pos<0){
                if(x->build<0){x->phase=4;continue;}
                x->heap_pos=x->build--; x->child=2*x->heap_pos+1;
            }
            if(x->child>=x->extent){x->heap_pos=-1;continue;}
            x->phase=1;
            if(x->child+1<x->extent){
                int a=x->child,b=a+1;if(heap_better(b,a))x->child=b;
                return emit("compare","heap.children",a,b,e.data[x->child]); /* @loc:heap.children */
            }
        }
        if(x->phase==1){
            x->phase=heap_better(x->child,x->heap_pos)?2:3;
            return emit("compare","heap.order",x->heap_pos,x->child,0); /* @loc:heap.order */
        }
        if(x->phase==2){
            int a=x->heap_pos,b=x->child;swap_at(a,b);x->heap_pos=b;x->child=2*b+1;x->phase=0;
            return emit("swap","heap.down",a,b,e.data[b]); /* @loc:heap.down */
        }
        if(x->phase==3){x->heap_pos=-1;x->phase=0;continue;}
        if(x->phase==4){
            if(e.op==-1 || e.op==0 || e.op==1) return complete();
            if(e.op==4 || e.op==7){x->result=e.data[0];e.found=0;return complete();}
            if(e.op==2 || e.op==5){
                x->heap_pos=e.n;e.data[e.n++]=e.arg;x->extent=e.n;x->phase=5;
                return emit("insert","heap.insert",x->heap_pos,-1,e.arg); /* @loc:heap.insert */
            }
            if(e.op==8){
                if(x->extent<=1)return complete();
                int b=--x->extent;swap_at(0,b);x->phase=0;x->build=0;x->heap_pos=-1;
                return emit("swap","heap.sort-root",0,b,e.data[b]); /* @loc:heap.sort-root */
            }
            x->result=e.data[0];e.data[0]=e.data[e.n-1];e.n--;x->extent=e.n;x->phase=0;x->build=0;x->heap_pos=-1;e.op=-1;
            return emit("delete","heap.extract",0,-1,(int)x->result); /* @loc:heap.extract */
        }
        if(x->phase==5){
            if(!x->heap_pos)return complete();
            int p=(x->heap_pos-1)/2;x->phase=heap_better(x->heap_pos,p)?6:7;
            return emit("compare","heap.up-order",x->heap_pos,p,0); /* @loc:heap.up-order */
        }
        if(x->phase==6){int a=x->heap_pos,b=(a-1)/2;swap_at(a,b);x->heap_pos=b;x->phase=5;return emit("swap","heap.up",a,b,e.data[b]);} /* @loc:heap.up */
        if(x->phase==7)return complete();
    }
}
static const char *next_step(void){return heap_step();}
