#ifndef DSA_ENGINE_H
#define DSA_ENGINE_H
#define LIMIT 32
#define VERTICES 16
#define HISTORY_LIMIT 4096
/* Module IDs are part of protocol v1; never renumber a released ID. */
enum Module { ARRAY=1, LINEAR, BINARY, INSERTION, MERGE, QUICK, LIST, STACK, QUEUE, BST, GRAPH, BFS, DFS, DIJKSTRA };
/* Operations are module-local: see registry and engine_config. */
int engine_config(int module,int operation,int count,int argument,int index,int directed);
int engine_value(int index,int value);
int engine_edge(int from,int to,int weight);
int engine_start(void);
const char *engine_error(void);
const char *engine_next(void);
const char *engine_state(void);
void engine_free(void);
#endif
