# Curriculum roadmap

Only the 14 versioned catalog modules in release 1 are functional. This roadmap proposes future work; none of these entries is an implemented module.

| Area | Proposed modules | Design/validation considerations |
|---|---|---|
| Hashing | chaining, open addressing, resizing | explicit hash policy, probe events, collisions/tombstones/load factor |
| Heaps | min/max heap, heap sort, priority queue | stable node identity across tree/array views; heap-order invariant |
| Balanced trees | AVL, red-black trees | rotation/color events; validate height/color invariants after mutations |
| Union-find | union by rank, path compression, Kruskal | representative identity and conceptual pointer rewrites |
| Recursion | call stacks, recurrence examples | explicit frames and bounded recursion depth |
| Backtracking | N-queens, subset search, maze | choose/unchoose extension events and branch/pruning explanations |
| Greedy methods | interval scheduling, Huffman | exchange-argument lessons and counterexamples |
| Dynamic programming | knapsack, LCS, matrix-chain | dependency-aware table adapters; subproblem state/checkpoints |
| Tries | prefix insert/search/delete | character labels, shared prefixes, terminal markers |
| String algorithms | KMP, Rabin–Karp, suffix structures | synchronized text/pattern indices, collision and prefix-function invariants |
| Range queries | Fenwick and segment trees, lazy propagation | interval adapters, aggregate invariants, lazy-tag extensions |
| Advanced graphs | topological ordering, SCC, Bellman–Ford, Floyd–Warshall, MST, flow | graph prerequisites, cycle/negative-cycle detection, capacity/residual edge identity |

Before adding a module, use the development guide and its acceptance gate. Larger workloads may need compact snapshots plus deterministic replay from periodic checkpoints rather than the release's full bounded snapshots. Measure memory and rendering before introducing Canvas or more infrastructure.
