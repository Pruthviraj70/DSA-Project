# DSA Learning Lab — implementation record

An interactive undergraduate DSA platform combining actual portable C execution, synchronized SVG visualization, source explanations, predictions, and server-graded assessments. Learners should understand state transitions, invariants, complexity, and edge cases, and compare algorithms using operation counts.

## Agreed stack and responsibilities

- React, TypeScript, Vite and SVG provide accessible interaction, layout, playback and source highlighting.
- A Web Worker runs an Emscripten-built WebAssembly C17 engine. C owns algorithm state and typed events. The same core runs native correctness tests. Browser-specific glue stays separate.
- Java LTS, Spring Boot, Maven wrapper, Spring Data JPA, Flyway and MySQL provide authentication, content, progress, experiments and official grading. No per-step backend traffic; database credentials never reach the client.
- IndexedDB retains guest work and pending checkpoint progress. GitHub Actions verifies builds and tests.

## First-release scope

Arrays (create/access/update/insert/delete); linear and binary search; insertion, merge and quicksort; singly linked list insert/delete/search/traverse; stack push/pop/peek; queue enqueue/dequeue/inspect; BST insert/search/delete and three traversals; graph editing; BFS, DFS and nonnegative Dijkstra. Every listed module must use actual C execution.

The learning interface includes a searchable catalog, examples and validation, playback including backward stepping, speed control, bounded history, synchronized executed C source and variables, prediction checkpoints, sorting comparison, guest exploration, account synchronization, saved experiments and server-graded assessments.

## Expansion strategy

A versioned module registry binds schemas, lifecycle, C implementations, event adapters, source locations, objectives, examples, invariants, assessments and tests. Future hashing, heaps, balanced trees, union-find, recursion, backtracking, greedy algorithms, dynamic programming, tries, strings, range queries and advanced graphs remain documented roadmap items, not functional catalog entries.

## Milestones and acceptance record

- [x] A: Read repository instructions and files; create this document as the first repository file change. Original README preserved.
- [x] B: Record architecture decisions, scope checklist and execution contracts.
- [x] C: Establish reproducible builds and input → C → Wasm worker → events → SVG slice.
- [x] D: Validate the vertical slice before expanding.
- [ ] E: Complete engine lifecycle, bounded execution and all released modules; native correctness, replay and cleanup tests.
- [ ] F: Complete learning interface, predictions, comparison and assessments.
- [ ] G: Complete authentication, normalized migrations, persistence, ownership and grading.
- [ ] H: Integrated browser/MySQL verification, CI, cross-platform documentation and reviewable Git delivery.

Tests will be recorded as executed/pass/fail/blocked, never inferred. Completion requires every listed module to run through the C engine and documented setup to reproduce the application. Final documentation must exist before removing this temporary record.

Vertical slice evidence: native array tests (5 cases) pass with AddressSanitizer/UBSan; production frontend and Emscripten 4.0.18 builds pass; Chromium executes the real Wasm worker and confirms insertion output (1 Playwright test). Vite public-module loading was corrected to use an absolute runtime URL. Playwright CDN is blocked; installed Chromium is supported via CHROMIUM_PATH.
