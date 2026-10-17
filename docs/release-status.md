# Release 1 acceptance record

For the subsequent lesson redesign, see [update verification and compatibility evidence](verification-update.md). Original release results below are historical.

Project: DSA Learning Lab. Original repository: DSA-Project. Work began with a read-only inspection of the initial README-only checkout; no AGENTS.md or branch conventions were present. The first repository file change was PROJECT_README_TEMP.md, committed separately before installing dependencies or generating code. Its plan and outcomes are consolidated here and in the final README/documentation.

| Milestone | Status | Evidence |
|---|---|---|
| A: temporary scope document first | Complete | fefae1a; original README preserved until final documentation |
| B: architecture and contracts | Complete | docs/architecture.md, event-protocol.md; versioned content registry |
| C: minimal C → Wasm worker → SVG slice | Complete | 886f418; actual array insertion through compiled C |
| D: test slice before expansion | Complete | Initial 5 native sanitizer cases and Chromium slice passed before adding other modules |
| E: all C modules and lifecycle | Complete | 14 modules / 34 operations; native invariants, randomized correctness, replay, reset, limits, cleanup and native/Wasm parity |
| F: learning interface | Complete | Catalog, schemas, edge cases, SVG/source/variables, playback, predictions, comparison, guest IndexedDB, practice, responsive keyboard flow |
| G: authentication/persistence/grading | Complete | Java 21 / Boot / MySQL / Flyway; 9 actual-MySQL integration tests; integrated account/browser flow |
| H: integrated verification and documentation | Complete locally | 2,168 native sanitizer cases; 34 operation traces; 5 frontend units; 9 actual-MySQL tests; 11 development and 8 production browser tests, zero skips. CI configured; Git publication outcome in verification.md. |

## Implemented scope

- Arrays: create/access/update/insert/delete.
- Linear and sorted-input binary search.
- Stable insertion and bottom-up merge sort; iterative Lomuto quicksort.
- Singly linked list: indexed insert/delete, first-match search, traverse.
- Array-backed stack push/pop/peek and queue enqueue/dequeue/inspect.
- Unbalanced BST insert/search/delete and inorder/preorder/postorder traversal; leaf, one-child, direct/deep-successor deletion cases covered.
- Graph creation/editing, stable IDs, directed/undirected integer weights, self-loops and disconnected vertices.
- BFS, explicit-stack DFS, and Dijkstra with negative-weight rejection and unreachable-distance handling.
- Bounded C state/events, 32-event worker batches, 4096-event history cap, termination/cancellation, deterministic reset and backward snapshot playback.
- Synchronized exact compiled C source and actual control variables; counters separate from pace.
- Versioned registry, learning content, examples, input validation and assessments for every module.
- Session authentication, ownership, public content, monotonic progress, saved input/configuration/version, transactionally server-graded historical attempts, instructor report and pagination.
- Normalized MySQL migrations, seed data, ER/data dictionary and SQL examples.
- Cross-platform setup, Docker builds, CI, extension guide, curriculum roadmap and research proposal.

## Explicit boundaries

The curriculum roadmap contains proposed topics only. There is no arbitrary user C compilation, production deployment, email verification/recovery, private high-stakes assessment bank, research telemetry, or performance/learning-efficacy claim. Browser tests exercise Chromium on Linux; native Windows/macOS host runs require follow-up on those operating systems. Authentication sessions are in one backend process; a restart signs users out. Full snapshots are deliberately bounded, not an unlimited replay architecture.

Git delivery uses feature/dsa-learning-lab; no merge, force-push or deployment is authorized or performed. GitHub API access was observed to return Forbidden. The feature branch was pushed and verified; draft PR creation returned Forbidden from api.github.com/graphql. The prepared PR body and exact retry command are in verification.md. This external delivery limitation does not block local application development.
