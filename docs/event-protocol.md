# Engine protocol v1

An isolated worker owns one C engine instance. `engine_config(module, operation, count, argument, index, directed)` clears the instance; `engine_value(index,value)` fills input and `engine_edge(from,to,weight)` builds edges. `engine_start()` validates prerequisites. `engine_next()` advances to one event, returning a JSON snapshot or null after completion. `engine_state()` inspects the current state; `engine_free()` clears it. Configuration functions return success/error status. Native and Wasm builds share these functions.

Requests: `{id, type:'init', input}`, `{id,type:'advance',limit:1..32}`. Responses echo IDs and include typed event arrays, done/error state. A new experiment terminates the old worker, including pending messages. Hosts reject stale responses. Limits are enforced in C and at the UI boundary. A host retains at most 4096 events and stops with an error if the engine exceeds the limit. Completion counts as an event.

Each event has `protocol:1`, `seq`, `kind`, `loc`, operand indices `a,b`, `value`, `done`, `found`, sequence `data`, conceptual `nodes`, graph `edges`, graph `dist`, `frontier`, actual C control `variables` and cumulative `counters`. Event kinds include ready, compare, swap, read, write, insert, delete, visit, enqueue, dequeue, pointer-update, relax and complete. Extensions must be documented and versioned. Indices are zero-based; node IDs are positive stable identities. Distances use null for infinity. Graph weights are integers; undirected edges are symmetric; Dijkstra rejects any negative weight. Duplicate sequence values are allowed; BST duplicates are ignored; graph IDs must be unique and parallel edges are replaced.

Code-location identifiers are comments `@loc:<id>` on the C emission sites. The build extracts the same C file and these line numbers to source.json, then compiles it. The UI highlights those lines. State is inspected after each emitted operation. Operation counters count emitted primitive events, separately from animation duration; initial construction is intentionally not counted. Backward playback uses complete snapshots bounded by fixed input/history limits; forward execution resumes from the worker's latest state after replay catches up.

The source extractor resolves annotations to the exact emission call (or ready assignment), even if a formatter moves a trailing annotation to a closing brace. Build outputs are staged and copied to the public engine directory only after successful compilation and source extraction. Rebuild after C changes; never edit generated source.json. The C API uses static bounded storage; engine_free clears all state, and reset uses engine_config plus the original validated input.

## Operation IDs and graph inputs

| Module | Operation IDs |
|---|---|
| Array (1) | 0 create, 1 access, 2 update, 3 insert, 4 delete |
| Linear/binary (2–3), sorts (4–6), BFS/DFS/Dijkstra (12–14) | 0 execute |
| List (7) | 0 indexed insert, 1 indexed delete, 2 first-match search, 3 traverse |
| Stack (8) | 0 push, 1 pop, 2 peek |
| Queue (9) | 0 enqueue, 1 dequeue, 2 inspect |
| BST (10) | 0 insert, 1 search, 2 delete, 3 inorder, 4 preorder, 5 postorder |
| Graph (11) | 0 inspect/create, 1 add node, 2 remove node, 3 set edge, 4 remove edge |

Sequence operations use `arg` as value/target and `index` as a zero-based index where relevant. Graph `values` contain stable vertex IDs. `engine_edge(from,to,weight)` receives **indices into values**, while graph edit operations use `index` as the source **ID** and `arg` as target **ID**. Node edits use `arg` as ID. `engine_graph_weight(weight)` configures a set-edge operation's integer weight. Algorithm `arg` is the source node ID. A graph matrix is at most 16×16, includes separate edge-presence bits so zero weights are valid, and follows outgoing edges for directed traversal.

Snapshot variables are actual C control values: i/j/key for insertion/list/BST, lo/hi/mid for binary search, width/left/right for merging, partition for quicksort, current/neighbor for graph traversal. Unused fields remain zero; see highlighted source for their module-specific meaning. Mutation events may group several pointer/adjacency writes into one conceptual operation; counters count emitted concepts, not CPU instructions or every internal assignment. IDs remain stable within an initialized experiment; using a result as a new input initializes a new experiment and can assign new list/BST IDs. Graph IDs are explicit input data and survive edits.

`data` is the current logical sequence for arrays/list/stack/queue/sorts, graph vertex IDs for graph modules, and the original construction sequence for BSTs. For a BST, `nodes` and `root` are the canonical current structure; the UI reconstructs preorder values when using a result as a new input. Array deletion preserves the removed value before shifting and emits it in the delete event (the unused argument does not determine the result).
