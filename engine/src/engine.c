#include "engine.h"
#include <limits.h>
#include <stdarg.h>
#include <stdio.h>
#include <string.h>

#ifndef DSA_LEGACY
#include "next_state.h"
#endif

typedef struct {
    int id, value, next, left, right, active;
} Node;
typedef struct {
#ifndef DSA_LEGACY
    NextState next;
#endif
    int edge_weight;
    int module, op, n, arg, index, directed, data[LIMIT], initial[LIMIT], edges[VERTICES][VERTICES], weight[VERTICES][VERTICES];
    int started, done, seq, a, b, value, found, i, j, k, phase;
    int root, head, tail, node_count;
    Node nodes[LIMIT + 1];
    int compares, reads, writes, swaps, visits, mutations;
    int key;
    int lo, hi, mid, width, start, left, right, end, temp[LIMIT], t;
    int ranges[LIMIT * 2], sp, pivot, partition;
    int seen[VERTICES], frontier[VERTICES], front_n, dist[VERTICES], parent[VERTICES], current, neighbor;
    int order[LIMIT], order_n, cursor;
    char error[160];
    const char *kind, *loc;
} Engine;
static Engine e;
static char json[32768];
static size_t used;
static int fail(const char *s) {
    snprintf(e.error, sizeof e.error, "%s", s);
    return 0;
}
const char *engine_error(void) {
    return e.error;
}
void engine_free(void) {
    memset(&e, 0, sizeof e);
}
int engine_config(int module, int operation, int count, int argument, int index, int directed) {
    engine_free();
    e.module = module;
    e.op = operation;
    e.n = count;
    e.arg = argument;
    e.index = index;
    e.directed = directed;
    e.found = -1;
    e.a = e.b = -1;
    if (module < ARRAY || module >
#ifdef DSA_LEGACY
        DIJKSTRA
#else
        WINDOW
#endif
    )
        return fail("Unknown module");
    if (count < 0 || count > LIMIT || ((module >= GRAPH && module <= DIJKSTRA) && count > VERTICES))
        return fail("Input exceeds module limit");
    if (argument < -100000 || argument > 100000)
        return fail("Argument must be between -100000 and 100000");
    if (directed != 0 && directed != 1)
        return fail("Direction must be 0 or 1");
    return 1;
}
int engine_value(int index, int value) {
    if (e.started || index < 0 || index >= e.n)
        return fail("Invalid input index");
    if (value < -100000 || value > 100000)
        return fail("Values must be between -100000 and 100000");
    e.data[index] = e.initial[index] = value;
    return 1;
}
int engine_graph_weight(int weight) {
    if (e.started || weight < -100000 || weight > 100000)
        return fail("Edge weight out of range");
    e.edge_weight = weight;
    return 1;
}
int engine_edge(int from, int to, int weight) {
    if (e.started || (e.module < GRAPH || e.module > DIJKSTRA) || from < 0 || to < 0 || from >= e.n || to >= e.n)
        return fail("Invalid graph endpoint");
    if (weight < -100000 || weight > 100000)
        return fail("Edge weight out of range");
    e.edges[from][to] = 1;
    e.weight[from][to] = weight;
    if (!e.directed) {
        e.edges[to][from] = 1;
        e.weight[to][from] = weight;
    }
    return 1;
}
static void append(const char *fmt, ...) {
    va_list args;
    va_start(args, fmt);
    int n = vsnprintf(json + used, sizeof json - used, fmt, args);
    va_end(args);
    if (n < 0 || (size_t)n >= sizeof json - used) {
        used = sizeof json - 1;
        return;
    }
    used += (size_t)n;
}
#ifndef DSA_LEGACY
static void next_snapshot(void);
#endif
static const char *snapshot(void) {
    used = 0;
    append("{\"protocol\":1,\"seq\":%d,\"kind\":\"%s\",\"loc\":\"%s\",\"a\":%d,\"b\":%d,\"value\":%d,\"done\":%s,\"found\":%d,\"data\":[", e.seq, e.kind ? e.kind : "ready", e.loc ? e.loc : "engine.ready", e.a, e.b, e.value, e.done ? "true" : "false", e.found);
    for (int i = 0; i < e.n; i++)
        append("%s%d", i ? "," : "", e.data[i]);
    append("],\"nodes\":[");
    int comma = 0;
    for (int i = 1; i <= e.node_count; i++) {
        Node *n = &e.nodes[i];
        if (n->active) {
            append("%s{\"id\":%d,\"value\":%d,\"next\":%d,\"left\":%d,\"right\":%d}", comma++ ? "," : "", n->id, n->value, n->next, n->left, n->right);
        }
    }
    append("],\"root\":%d,\"head\":%d,\"edges\":[", e.root, e.head);
    comma = 0;
    for (int i = 0; i < e.n && e.module >= GRAPH && e.module <= DIJKSTRA; i++)
        for (int j = 0; j < e.n; j++)
            if (e.edges[i][j] && (e.directed || i <= j))
                append("%s{\"id\":%d,\"from\":%d,\"to\":%d,\"weight\":%d}", comma++ ? "," : "", (e.directed || e.data[i] <= e.data[j] ? e.data[i] * 32 + e.data[j] : e.data[j] * 32 + e.data[i]), e.data[i], e.data[j], e.weight[i][j]);
    append("],\"dist\":[");
    for (int i = 0; i < e.n && e.module >= GRAPH && e.module <= DIJKSTRA; i++) {
        if (e.dist[i] == INT_MAX)
            append("%snull", i ? "," : "");
        else
            append("%s%d", i ? "," : "", e.dist[i]);
    }
    append("],\"frontier\":[");
    for (int i = 0; i < e.front_n; i++)
        append("%s%d", i ? "," : "", e.data[e.frontier[i]]);
    append("],\"variables\":{\"i\":%d,\"j\":%d,\"key\":%d,\"lo\":%d,\"hi\":%d,\"mid\":%d,\"width\":%d,\"left\":%d,\"right\":%d,\"partition\":%d,\"current\":%d,\"neighbor\":%d},\"counters\":{\"compare\":%d,\"read\":%d,\"write\":%d,\"swap\":%d,\"visit\":%d,\"mutation\":%d}}", e.i, e.j, e.key, e.lo, e.hi, e.mid, e.width, e.left, e.right, e.partition, e.current, e.neighbor, e.compares, e.reads, e.writes, e.swaps, e.visits, e.mutations);
#ifndef DSA_LEGACY
    if (e.module >= HASH_CHAIN) { used--; next_snapshot(); append("}"); }
#endif
    return json;
}
const char *engine_state(void) {
    return snapshot();
}
static const char *emit(const char *kind, const char *loc, int a, int b, int value) {
    e.kind = kind;
    e.loc = loc;
    e.a = a;
    e.b = b;
    e.value = value;
    e.seq++;
    if (!strcmp(kind, "compare"))
        e.compares++;
    else if (!strcmp(kind, "read"))
        e.reads++;
    else if (!strcmp(kind, "write"))
        e.writes++;
    else if (!strcmp(kind, "swap"))
        e.swaps++;
    else if (!strcmp(kind, "visit"))
        e.visits++;
    else if (strcmp(kind, "complete"))
        e.mutations++;
    return snapshot();
}
static const char *complete(void) {
    e.done = 1;
    return emit("complete", "engine.complete", -1, -1, e.found);
} /* @loc:engine.complete */
static const char *array_step(void) {
    switch (e.op) {
    case 0:
        return complete(); /* create */
    case 1:
        e.found = e.index;
        e.done = 1;
        return emit("read", "array.access", e.index, -1, e.data[e.index]); /* @loc:array.access */
    case 2:
        e.data[e.index] = e.arg;
        e.done = 1;
        return emit("write", "array.update", e.index, -1, e.arg); /* @loc:array.update */
    case 3:
        if (e.i > e.index) {
            e.data[e.i] = e.data[e.i - 1];
            e.i--;
            return emit("write", "array.shift-right", e.i + 1, e.i, e.data[e.i]);
        } /* @loc:array.shift-right */
        e.data[e.index] = e.arg;
        e.n++;
        e.done = 1;
        return emit("insert", "array.insert", e.index, -1, e.arg); /* @loc:array.insert */
    case 4:
        if (e.i < e.n - 1) {
            e.data[e.i] = e.data[e.i + 1];
            e.i++;
            return emit("write", "array.shift-left", e.i - 1, e.i, e.data[e.i - 1]);
        } /* @loc:array.shift-left */
        e.n--;
        e.done = 1;
        return emit("delete", "array.delete", e.index, -1, e.key); /* @loc:array.delete */
    case 5:
        if (e.i >= e.n) return complete();
        e.i++;
        return emit("visit", "array.traverse", e.i - 1, -1, e.data[e.i - 1]); /* @loc:array.traverse */
    default:
        return complete();
    }
}
static const char *search_step(void) {
    if (e.module == LINEAR) {
        if (e.i >= e.n)
            return complete();
        int i = e.i++;
        if (e.data[i] == e.arg) {
            e.found = i;
            e.done = 1;
        }
        return emit("compare", "linear.compare", i, -1, e.arg); /* @loc:linear.compare */
    }
    if (e.lo > e.hi)
        return complete();
    int mid = e.lo + (e.hi - e.lo) / 2;
    e.mid = mid;
    if (e.data[mid] == e.arg) {
        e.found = mid;
        e.done = 1;
    } else if (e.data[mid] < e.arg)
        e.lo = mid + 1;
    else
        e.hi = mid - 1;
    return emit("compare", "binary.compare", mid, -1, e.arg); /* @loc:binary.compare */
}
static void swap_at(int i, int j) {
    int v = e.data[i];
    e.data[i] = e.data[j];
    e.data[j] = v;
}
static const char *insertion_step(void) {
    for (;;) {
        if (e.i >= e.n)
            return complete();
        if (e.phase == 0) {
            e.key = e.data[e.i];
            e.j = e.i - 1;
            e.phase = 1;
        }
        if (e.phase == 1) {
            if (e.j < 0) {
                e.phase = 3;
                continue;
            }
            e.phase = e.data[e.j] > e.key ? 2 : 3;
            return emit("compare", "insertion.compare", e.j, e.i, e.key); /* @loc:insertion.compare */
        }
        if (e.phase == 2) {
            e.data[e.j + 1] = e.data[e.j];
            int j = e.j--;
            e.phase = 1;
            return emit("write", "insertion.shift", j + 1, j, e.data[j + 1]);
        } /* @loc:insertion.shift */
        e.data[e.j + 1] = e.key;
        int at = e.j + 1;
        e.i++;
        e.phase = 0;
        return emit("write", "insertion.place", at, -1, e.key); /* @loc:insertion.place */
    }
}
static const char *merge_step(void) {
    for (;;) {
        if (e.width >= e.n)
            return complete();
        if (e.phase == 0) {
            if (e.start >= e.n) {
                e.width *= 2;
                e.start = 0;
                continue;
            }
            e.left = e.start;
            e.mid = e.start + e.width;
            if (e.mid > e.n)
                e.mid = e.n;
            e.right = e.mid;
            e.end = e.start + 2 * e.width;
            if (e.end > e.n)
                e.end = e.n;
            e.t = 0;
            e.phase = 1;
        }
        if (e.phase == 1) {
            if (e.left < e.mid && e.right < e.end) {
                e.phase = 2;
                return emit("compare", "merge.compare", e.left, e.right, 0);
            } /* @loc:merge.compare */
            e.phase = 2;
        }
        if (e.phase == 2) {
            if (e.left < e.mid || e.right < e.end) {
                int take = e.right >= e.end || (e.left < e.mid && e.data[e.left] <= e.data[e.right]);
                int i = take ? e.left++ : e.right++;
                e.temp[e.t++] = e.data[i];
                e.phase = 1;
                return emit("read", "merge.buffer", i, -1, e.data[i]); /* @loc:merge.buffer */
            }
            e.k = 0;
            e.phase = 3;
        }
        if (e.k < e.t) {
            int i = e.start + e.k;
            e.data[i] = e.temp[e.k++];
            return emit("write", "merge.write", i, -1, e.data[i]);
        } /* @loc:merge.write */
        e.start += 2 * e.width;
        e.phase = 0;
    }
}
static const char *quick_step(void) {
    for (;;) {
        if (e.phase == 0) {
            if (e.sp == 0)
                return complete();
            e.hi = e.ranges[--e.sp];
            e.lo = e.ranges[--e.sp];
            if (e.lo >= e.hi)
                continue;
            e.pivot = e.data[e.hi];
            e.partition = e.lo;
            e.j = e.lo;
            e.phase = 1;
        }
        if (e.phase == 1) {
            if (e.j >= e.hi) {
                e.phase = 3;
                continue;
            }
            e.phase = e.data[e.j] <= e.pivot ? 2 : 4;
            return emit("compare", "quick.compare", e.j, e.hi, e.pivot); /* @loc:quick.compare */
        }
        if (e.phase == 2) {
            int i = e.partition++;
            swap_at(i, e.j);
            e.phase = 4;
            return emit("swap", "quick.swap", i, e.j, e.pivot);
        } /* @loc:quick.swap */
        if (e.phase == 4) {
            e.j++;
            e.phase = 1;
            continue;
        }
        int p = e.partition;
        swap_at(p, e.hi);
        if (p - 1 > e.lo) {
            e.ranges[e.sp++] = e.lo;
            e.ranges[e.sp++] = p - 1;
        }
        if (p + 1 < e.hi) {
            e.ranges[e.sp++] = p + 1;
            e.ranges[e.sp++] = e.hi;
        }
        e.phase = 0;
        return emit("swap", "quick.pivot", p, e.hi, e.pivot); /* @loc:quick.pivot */
    }
}
static int new_node(int value) {
    int id = ++e.node_count;
    e.nodes[id] = (Node){.id = id, .value = value, .active = 1};
    return id;
}
static void build_bst(int value) {
    int p = 0, c = e.root;
    while (c) {
        p = c;
        if (value == e.nodes[c].value)
            return;
        c = value < e.nodes[c].value ? e.nodes[c].left : e.nodes[c].right;
    }
    int id = new_node(value);
    if (!p)
        e.root = id;
    else if (value < e.nodes[p].value)
        e.nodes[p].left = id;
    else
        e.nodes[p].right = id;
}
static void traversal(int id, int mode) {
    if (!id)
        return;
    Node *n = &e.nodes[id];
    if (mode == 4)
        e.order[e.order_n++] = id;
    traversal(n->left, mode);
    if (mode == 3)
        e.order[e.order_n++] = id;
    traversal(n->right, mode);
    if (mode == 5)
        e.order[e.order_n++] = id;
}
static void sync_list(void) {
    int n = 0;
    for (int c = e.head; c; c = e.nodes[c].next)
        e.data[n++] = e.nodes[c].value;
    e.n = n;
}
static const char *list_step(void) {
    if (e.op == 2 || e.op == 3) {
        if (!e.i)
            return complete();
        int id = e.i;
        e.i = e.nodes[id].next;
        if (e.op == 2 && e.nodes[id].value == e.arg) {
            e.found = id;
            e.done = 1;
        }
        return emit(e.op == 2 ? "compare" : "visit", "list.visit", id, -1, e.nodes[id].value); /* @loc:list.visit */
    }
    if (e.j < e.index) {
        int id = e.i;
        e.k = id;
        e.i = e.nodes[id].next;
        e.j++;
        return emit("visit", "list.seek", id, -1, e.j);
    } /* @loc:list.seek */
    if (e.op == 0) {
        int id = new_node(e.arg);
        e.nodes[id].next = e.i;
        if (e.k)
            e.nodes[e.k].next = id;
        else
            e.head = id;
        sync_list();
        e.done = 1;
        return emit("pointer-update", "list.insert", id, e.k, e.arg); /* @loc:list.insert */
    }
    int id = e.i;
    if (e.k)
        e.nodes[e.k].next = e.nodes[id].next;
    else
        e.head = e.nodes[id].next;
    e.nodes[id].active = 0;
    sync_list();
    e.done = 1;
    return emit("delete", "list.delete", id, e.k, e.nodes[id].value); /* @loc:list.delete */
}
static const char *stack_queue_step(void) {
    if (e.op == 0) {
        e.data[e.n++] = e.arg;
        e.done = 1;
        return emit(e.module == STACK ? "insert" : "enqueue", "sequence.push", e.n - 1, -1, e.arg);
    } /* @loc:sequence.push */
    if (e.op == 2) {
        e.done = 1;
        int i = e.module == STACK ? e.n - 1 : 0;
        return emit("read", "sequence.peek", i, -1, e.data[i]);
    } /* @loc:sequence.peek */
    if (e.module == STACK) {
        int value = e.data[--e.n];
        e.done = 1;
        return emit("delete", "stack.pop", e.n, -1, value);
    } /* @loc:stack.pop */
    int value = e.data[0];
    for (int i = 0; i < e.n - 1; i++)
        e.data[i] = e.data[i + 1];
    e.n--;
    e.done = 1;
    return emit("dequeue", "queue.dequeue", 0, -1, value); /* @loc:queue.dequeue */
}
static void replace_child(int parent, int old, int replacement) {
    if (!parent)
        e.root = replacement;
    else if (e.nodes[parent].left == old)
        e.nodes[parent].left = replacement;
    else
        e.nodes[parent].right = replacement;
}
static const char *bst_step(void) {
    if (e.op >= 3) {
        if (e.cursor >= e.order_n)
            return complete();
        int id = e.order[e.cursor++];
        return emit("visit", "bst.traverse", id, -1, e.nodes[id].value);
    } /* @loc:bst.traverse */
    if (e.phase == 0) {
        if (!e.i) {
            if (e.op != 0)
                return complete();
            int id = new_node(e.arg);
            if (!e.j)
                e.root = id;
            else if (e.arg < e.nodes[e.j].value)
                e.nodes[e.j].left = id;
            else
                e.nodes[e.j].right = id;
            e.done = 1;
            return emit("pointer-update", "bst.insert", id, e.j, e.arg); /* @loc:bst.insert */
        }
        int id = e.i;
        if (e.nodes[id].value == e.arg) {
            e.found = id;
            if (e.op == 2) {
                e.k = id;
                e.phase = 1;
            } else
                e.done = 1;
        } else {
            e.j = id;
            e.i = e.arg < e.nodes[id].value ? e.nodes[id].left : e.nodes[id].right;
        }
        return emit("compare", "bst.search", id, -1, e.arg); /* @loc:bst.search */
    }
    Node *target = &e.nodes[e.k];
    if (e.phase == 1) {
        if (!target->left || !target->right) {
            int child = target->left ? target->left : target->right;
            replace_child(e.j, e.k, child);
            target->active = 0;
            e.done = 1;
            return emit("delete", "bst.delete-simple", e.k, child, e.arg); /* @loc:bst.delete-simple */
        }
        e.t = e.k;
        e.i = target->right;
        e.phase = 2;
    }
    if (e.nodes[e.i].left) {
        int id = e.i;
        e.t = id;
        e.i = e.nodes[id].left;
        return emit("visit", "bst.successor", id, -1, e.nodes[id].value);
    } /* @loc:bst.successor */
    int successor = e.i;
    if (e.t != e.k) {
        e.nodes[e.t].left = e.nodes[successor].right;
        e.nodes[successor].right = target->right;
    }
    e.nodes[successor].left = target->left;
    replace_child(e.j, e.k, successor);
    target->active = 0;
    e.done = 1;
    return emit("delete", "bst.delete-two", e.k, successor, e.arg); /* @loc:bst.delete-two */
}
static int vertex(int id) {
    for (int i = 0; i < e.n; i++)
        if (e.data[i] == id)
            return i;
    return -1;
}
static const char *graph_step(void) {
    if (e.op == 0)
        return complete();
    if (e.op == 1) {
        e.data[e.n] = e.arg;
        e.dist[e.n] = INT_MAX;
        e.n++;
        e.done = 1;
        return emit("insert", "graph.add-node", e.arg, -1, e.arg);
    } /* @loc:graph.add-node */
    if (e.op == 2) {
        int at = e.i, id = e.data[at];
        for (int i = at; i < e.n - 1; i++) {
            e.data[i] = e.data[i + 1];
            for (int j = 0; j < e.n; j++) {
                e.edges[i][j] = e.edges[i + 1][j];
                e.weight[i][j] = e.weight[i + 1][j];
            }
        }
        for (int j = at; j < e.n - 1; j++)
            for (int i = 0; i < e.n - 1; i++) {
                e.edges[i][j] = e.edges[i][j + 1];
                e.weight[i][j] = e.weight[i][j + 1];
            }
        e.n--;
        for (int i = 0; i < VERTICES; i++) {
            e.edges[e.n][i] = e.edges[i][e.n] = 0;
            e.weight[e.n][i] = e.weight[i][e.n] = 0;
        }
        e.done = 1;
        return emit("delete", "graph.remove-node", id, -1, id); /* @loc:graph.remove-node */
    }
    int add = e.op == 3;
    e.edges[e.i][e.j] = add;
    e.weight[e.i][e.j] = e.edge_weight;
    if (!e.directed) {
        e.edges[e.j][e.i] = add;
        e.weight[e.j][e.i] = e.edge_weight;
    }
    e.done = 1;
    return emit(add ? "insert" : "delete", "graph.edge", e.data[e.i], e.data[e.j], e.edge_weight); /* @loc:graph.edge */
}
static const char *bfs_step(void) {
    for (;;) {
        if (e.phase == 0) {
            e.frontier[e.front_n++] = e.current;
            e.seen[e.current] = 1;
            e.phase = 1;
            return emit("enqueue", "bfs.start", e.data[e.current], -1, 0);
        } /* @loc:bfs.start */
        if (e.phase == 1) {
            if (!e.front_n)
                return complete();
            e.current = e.frontier[0];
            for (int i = 0; i < e.front_n - 1; i++)
                e.frontier[i] = e.frontier[i + 1];
            e.front_n--;
            e.phase = 2;
            return emit("dequeue", "bfs.dequeue", e.data[e.current], -1, 0); /* @loc:bfs.dequeue */
        }
        if (e.phase == 2) {
            e.neighbor = 0;
            e.phase = 3;
            return emit("visit", "bfs.visit", e.data[e.current], -1, 0);
        } /* @loc:bfs.visit */
        while (e.neighbor < e.n) {
            int j = e.neighbor++;
            if (e.edges[e.current][j] && !e.seen[j]) {
                e.seen[j] = 1;
                e.frontier[e.front_n++] = j;
                return emit("enqueue", "bfs.enqueue", e.data[j], e.data[e.current], 0);
            }
        } /* @loc:bfs.enqueue */
        e.phase = 1;
    }
}
static const char *dfs_step(void) {
    for (;;) {
        if (e.phase == 0) {
            e.frontier[e.front_n++] = e.current;
            e.seen[e.current] = 1;
            e.phase = 1;
            return emit("enqueue", "dfs.start", e.data[e.current], -1, 0);
        } /* @loc:dfs.start */
        if (!e.front_n)
            return complete();
        e.current = e.frontier[e.front_n - 1];
        if (e.phase == 1) {
            e.phase = 2;
            return emit("visit", "dfs.visit", e.data[e.current], -1, 0);
        } /* @loc:dfs.visit */
        while (e.parent[e.current] < e.n) {
            int j = e.parent[e.current]++;
            if (e.edges[e.current][j] && !e.seen[j]) {
                e.seen[j] = 1;
                e.frontier[e.front_n++] = j;
                e.phase = 1;
                return emit("enqueue", "dfs.descend", e.data[j], e.data[e.current], 0);
            }
        } /* @loc:dfs.descend */
        e.front_n--;
        return emit("dequeue", "dfs.return", e.data[e.current], -1, 0); /* @loc:dfs.return */
    }
}
static const char *dijkstra_step(void) {
    for (;;) {
        if (e.phase == 0) {
            int best = -1;
            for (int i = 0; i < e.n; i++)
                if (!e.seen[i] && e.dist[i] != INT_MAX && (best < 0 || e.dist[i] < e.dist[best]))
                    best = i;
            if (best < 0)
                return complete();
            e.current = best;
            e.seen[best] = 1;
            e.neighbor = 0;
            e.phase = 1;
            return emit("visit", "dijkstra.settle", e.data[best], -1, e.dist[best]); /* @loc:dijkstra.settle */
        }
        while (e.neighbor < e.n) {
            int j = e.neighbor++;
            if (e.edges[e.current][j] && !e.seen[j]) {
                int candidate = e.dist[e.current] + e.weight[e.current][j];
                if (candidate < e.dist[j]) {
                    e.dist[j] = candidate;
                    e.parent[j] = e.current;
                    return emit("relax", "dijkstra.relax", e.data[e.current], e.data[j], candidate);
                }                                                                                    /* @loc:dijkstra.relax */
                return emit("compare", "dijkstra.compare", e.data[e.current], e.data[j], candidate); /* @loc:dijkstra.compare */
            }
        }
        e.phase = 0;
    }
}
#ifndef DSA_LEGACY
#include "next.c"
#endif
int engine_start(void) {
    if (e.error[0])
        return 0;
    if (e.started)
        return fail("Engine already started");
#ifndef DSA_LEGACY
    if (e.module >= HASH_CHAIN) {
        if (!next_start()) return 0;
    } else
#endif
    if (e.module == ARRAY) {
        if (e.op < 0 || e.op > 5)
            return fail("Invalid array operation");
        if ((e.op == 1 || e.op == 2 || e.op == 4) && (e.index < 0 || e.index >= e.n))
            return fail("Index must address an existing element");
        if (e.op == 3 && (e.index < 0 || e.index > e.n || e.n == LIMIT))
            return fail("Insert needs an index in 0..length and spare capacity");
        e.i = e.op == 5 ? 0 : (e.op == 3 ? e.n : e.index);
        if (e.op == 4)
            e.key = e.data[e.index];
    } else if (e.module == LINEAR || e.module == BINARY) {
        if (e.op != 0)
            return fail("Invalid search operation");
        e.lo = 0;
        e.hi = e.n - 1;
        if (e.module == BINARY)
            for (int i = 1; i < e.n; i++)
                if (e.data[i] < e.data[i - 1])
                    return fail("Binary search requires sorted ascending input");
    } else if (e.module >= INSERTION && e.module <= QUICK) {
        if (e.op != 0)
            return fail("Invalid sort operation");
        e.i = 1;
        e.width = 1;
        if (e.n > 1) {
            e.ranges[e.sp++] = 0;
            e.ranges[e.sp++] = e.n - 1;
        }
    } else if (e.module == LIST) {
        if (e.op < 0 || e.op > 3)
            return fail("Invalid linked-list operation");
        if (e.op == 0 && (e.n == LIMIT || e.index < 0 || e.index > e.n))
            return fail("List insert needs capacity and index in 0..length");
        if (e.op == 1 && (e.index < 0 || e.index >= e.n))
            return fail("List delete requires an existing index");
        for (int i = 0; i < e.n; i++) {
            int id = new_node(e.data[i]);
            if (i)
                e.nodes[id - 1].next = id;
        }
        e.head = e.n ? 1 : 0;
        e.i = e.head;
    } else if (e.module == STACK || e.module == QUEUE) {
        if (e.op < 0 || e.op > 2)
            return fail("Invalid stack/queue operation");
        if (e.op == 0 && e.n == LIMIT)
            return fail("Capacity is 32 values");
        if (e.op != 0 && e.n == 0)
            return fail("Cannot remove or inspect an empty structure");
    } else if (e.module == BST) {
        if (e.op < 0 || e.op > 5)
            return fail("Invalid BST operation");
        for (int i = 0; i < e.n; i++)
            build_bst(e.data[i]);
        if (e.op == 0 && e.node_count == LIMIT) {
            int c = e.root;
            while (c && e.nodes[c].value != e.arg)
                c = e.arg < e.nodes[c].value ? e.nodes[c].left : e.nodes[c].right;
            if (!c)
                return fail("BST capacity is 32 nodes");
        }
        e.i = e.root;
        if (e.op >= 3)
            traversal(e.root, e.op);
    } else {
        for (int i = 0; i < e.n; i++) {
            if (e.data[i] < 1 || e.data[i] > 31)
                return fail("Graph node IDs must be in 1..31");
            for (int j = 0; j < i; j++)
                if (e.data[i] == e.data[j])
                    return fail("Graph node IDs must be unique");
            e.dist[i] = INT_MAX;
        }
        if (e.module == GRAPH) {
            if (e.op < 0 || e.op > 4)
                return fail("Invalid graph operation");
            if (e.op == 1 && (e.n == VERTICES || e.arg < 1 || e.arg > 31 || vertex(e.arg) >= 0))
                return fail("Add a unique node ID in 1..31; maximum 16 nodes");
            if (e.op == 2 && (e.i = vertex(e.arg)) < 0)
                return fail("Node to remove does not exist");
            if (e.op >= 3) {
                e.i = vertex(e.index);
                e.j = vertex(e.arg);
                if (e.i < 0 || e.j < 0)
                    return fail("Edge endpoints must exist");
            }
        } else {
            if (e.op != 0)
                return fail("Invalid graph algorithm operation");
            if (!e.n)
                return fail("Choose a start node in a nonempty graph");
            e.current = vertex(e.arg);
            if (e.current < 0)
                return fail("Start node must exist");
            e.dist[e.current] = 0;
            if (e.module == DIJKSTRA)
                for (int i = 0; i < e.n; i++)
                    for (int j = 0; j < e.n; j++)
                        if (e.edges[i][j] && e.weight[i][j] < 0)
                            return fail("Dijkstra requires nonnegative edge weights");
        }
    }
    e.started = 1;
    e.kind = "ready";
    e.loc = "engine.ready";
    return 1; /* @loc:engine.ready */
}
const char *engine_next(void) {
    if (!e.started || e.done || e.error[0])
        return NULL;
    if (e.seq >= HISTORY_LIMIT - 1) {
        fail("Event budget exhausted");
        return NULL;
    }
#ifndef DSA_LEGACY
    if (e.module >= HASH_CHAIN) return next_step();
#endif
    switch (e.module) {
    case ARRAY:
        return array_step();
    case LINEAR:
    case BINARY:
        return search_step();
    case INSERTION:
        return insertion_step();
    case MERGE:
        return merge_step();
    case QUICK:
        return quick_step();
    case LIST:
        return list_step();
    case STACK:
    case QUEUE:
        return stack_queue_step();
    case BST:
        return bst_step();
    case GRAPH:
        return graph_step();
    case BFS:
        return bfs_step();
    case DFS:
        return dfs_step();
    case DIJKSTRA:
        return dijkstra_step();
    default:
        return NULL;
    }
}
