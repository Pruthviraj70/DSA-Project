# Next modules release checklist

Baseline: origin/main `deb646d` (contains accepted learning-lab, preferences and ad342e9 Foundations durability fix). PR target: main. Existing migrations V1–V5 and persisted slide IDs remain immutable. No database reset or automatic completion of new material.

- [x] Inspect architecture, history, instructions and baseline.
- [x] Define contracts, concepts, prerequisites and lessons.
- [x] Heap vertical slice: native C → Wasm worker → events → paired array/tree lesson.
- [x] Chaining/probing hash tables, heap operations, recursive frames, two pointers and sliding windows.
- [x] Native correctness, limits, cleanup and deterministic replay.
- [x] Five-language examples and aligned practice/recorded quizzes.
- [x] Additive content migration, catalog, experiments and progress.
- [x] Native/Wasm/browser/frontend/MySQL verification and visual inspection.
- [x] Final documentation, commits and feature-branch publication.

## Contracts

Runtime IDs 1–14 retain their meanings. New IDs: 15 chaining hash table, 16 linear probing, 17 heap/priority queue (including heap sort), 18 recursive examples, 19 two pointers, 20 sliding windows. Integer inputs remain bounded at ±100000, sequence length 32. Hash inputs are alternating key,value pairs (at most 16 pairs); duplicate keys update. Argument/index fields are module-specific and labelled in lessons. Recursion uses explicit resumable call frames representing the recursive C control flow, with bounded depth/steps and real returned values. Each advancement emits at most one state transition. All state is owned by C; presentation consumes complete bounded snapshots and uses the existing deterministic snapshot playback.

The next executable is loaded lazily only for IDs 15–20; legacy learners continue loading the original executable. A shared C source/API compiles natively and for both Wasm entry points. New event extensions contain hash buckets/entries, frames and returns, heap extent, pointer positions, window sums and result prefix length. Conceptual IDs are not memory addresses. No HTTP requests are made per step.

Prerequisites will be recorded against actual taught concepts: arrays/Foundations for hashing and heaps; stacks and searching for recursion; searching/arrays for two pointers; two pointers for sliding-window boundary reasoning. All teaching precedes FAQs/final quizzes; historical recorded questions remain unchanged.

Vertical slice evidence: 2,170 legacy native cases plus 2,328 heap cases passed under ASan/UBSan; both Wasm builds and the actual browser heap playback test passed. Full curriculum/quizzes follow in the content milestone.

Content/engine milestone: all 32 new operations have teaching-page bindings. Twelve content tests validate 14 lessons, 120 concepts and 91 questions. Native extension oracles cover 12,968 cases; 79 cross-target traces include empty, collision, overflow-bound and repeated-call cases. All 270 displayed examples compile and 80 new example executions pass in the five languages. MySQL grading/persistence and compatibility tests passed before final ordinal-only lesson refinements; final verification reruns are pending below.

Final verification record: docs/verification-next-modules.md. Legacy migration fixture now seeds and closes before app startup; no product persistence assertion was removed. Rich visual layout regressions and all existing preferences flows are retained.

Release verification complete: 45 integrated development browser checks and 39 production checks passed without skips; the legacy upgrade fixture also passed five focused production runs. Final observed results and resolved failures are in verification-next-modules.md. The verified code is published on feature/dsa-next-modules.

Publication: normal push succeeded at verified code commit 946889706c6decd9c07d19e8ea9972ccca65cc05. Draft-PR creation returned `Post https://api.github.com/graphql: Forbidden`. The implementation is complete; PR creation/remote CI review requires GitHub API/UI access. Comparison: https://github.com/Pruthviraj70/DSA-Project/compare/main...feature/dsa-next-modules?expand=1 . Complete PR body: pull-request-next-modules.md.
