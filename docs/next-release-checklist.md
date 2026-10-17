# Next modules release checklist

Baseline: origin/main `deb646d` (contains accepted learning-lab, preferences and ad342e9 Foundations durability fix). PR target: main. Existing migrations V1–V5 and persisted slide IDs remain immutable. No database reset or automatic completion of new material.

- [x] Inspect architecture, history, instructions and baseline.
- [ ] Define contracts, concepts, prerequisites and lessons.
- [x] Heap vertical slice: native C → Wasm worker → events → paired array/tree lesson.
- [ ] Chaining/probing hash tables, heap operations, recursive frames, two pointers and sliding windows.
- [ ] Native correctness, limits, cleanup and deterministic replay.
- [ ] Five-language examples and aligned practice/recorded quizzes.
- [ ] Additive content migration, catalog, experiments and progress.
- [ ] Native/Wasm/browser/frontend/MySQL verification and visual inspection.
- [ ] Final documentation, commits and publication.

## Contracts

Runtime IDs 1–14 retain their meanings. New IDs: 15 chaining hash table, 16 linear probing, 17 heap/priority queue (including heap sort), 18 recursive examples, 19 two pointers, 20 sliding windows. Integer inputs remain bounded at ±100000, sequence length 32. Hash inputs are alternating key,value pairs (at most 16 pairs); duplicate keys update. Argument/index fields are module-specific and labelled in lessons. Recursion uses explicit resumable call frames representing the recursive C control flow, with bounded depth/steps and real returned values. Each advancement emits at most one state transition. All state is owned by C; presentation consumes complete bounded snapshots and uses the existing deterministic snapshot playback.

The next executable is loaded lazily only for IDs 15–20; legacy learners continue loading the original executable. A shared C source/API compiles natively and for both Wasm entry points. New event extensions contain hash buckets/entries, frames and returns, heap extent, pointer positions, window sums and result prefix length. Conceptual IDs are not memory addresses. No HTTP requests are made per step.

Prerequisites will be recorded against actual taught concepts: arrays/Foundations for hashing and heaps; stacks and searching for recursion; searching/arrays for two pointers; two pointers for sliding-window boundary reasoning. All teaching precedes FAQs/final quizzes; historical recorded questions remain unchanged.

Vertical slice evidence: 2,170 legacy native cases plus 2,328 heap cases passed under ASan/UBSan; both Wasm builds and the actual browser heap playback test passed. Full curriculum/quizzes follow in the content milestone.
