# Lesson redesign: implementation decisions

Use the existing feature/dsa-learning-lab checkout; no temporary README, worktree, push, merge or deployment. The requested macOS path is not attached here; implementation uses /workspace/DSA-Project.

The public catalog groups the 14 existing runtime topics into Arrays, Linked lists, Stacks, Queues, BSTs, Graphs, Searching and Sorting, plus a new Foundations module. Runtime module IDs stay unchanged. Old experiment versions are preserved; runtime 1.1.0 adds actual array traversal while retaining 1.0.0 input compatibility. Old topic links and saved experiments map to the appropriate stable teaching slide. Foundations is an explicit recommended prerequisite; exploration is never blocked.

A separate versioned curriculum registry owns stable module/slide/concept IDs, teaching content, visual bindings and example IDs. Public practice questions are separate from server-owned recorded assessment questions. Official answer keys never enter browser imports or assets. Server grading remains transactional and historical question revisions/snapshots remain intact.

Flyway V3 adds curriculum concepts, stable lesson slides, question-concept mappings, per-slide completion and resume positions. Existing tables and V1/V2 migrations are retained. Legacy percentage progress remains prior activity; it does not automatically complete new or expanded slides. Completion is a monotonic union of explicitly completed slide IDs. Resume position follows the latest synchronized navigation; a guest position seeds an account only if that account has no position. Authenticated offline checkpoints remain pending until acknowledged. IndexedDB upgrades add stores without clearing experiments/checkpoints.

Examples are educational implementations in C, C++, Java, Python and JavaScript. Language selection changes examples only. No execution-line highlighting is claimed for examples. Syntax highlighting uses static tokens, not execution events. Source dependencies, preconditions, edge cases, alternatives and complexity belong to each example. Underlying portable C/Wasm/worker execution and bounded playback remain unchanged.

Lesson navigation uses hash URLs containing stable module and slide IDs, browser history and explicit page controls. Navigation saves a checkpoint per slide; animation events never cause HTTP progress traffic. The learner UI exposes concepts, values, controls and explanation, with internal versions/locations/runtime errors kept in diagnostics.

Acceptance: curriculum negative validation tests; executable multilingual examples; legacy-data MySQL migration/security/grading tests; real Wasm parity; home/navigation/logo/restoration/progress/code-copy/quiz browser flows; desktop/mobile visual review; final documentation and local commits only.

## Milestones

| Milestone | Outcome |
|---|---|
| Inspection and compatibility contracts | Complete; existing branch, architecture, storage and V1/V2 inspected; no unrelated initial changes |
| Tile home, slide lessons and Foundations | Complete; nine grouped modules, 87 stable slides, responsive and keyboard navigation |
| Multilingual educational examples | Complete; 38 examples in five languages, alternatives and independent compilation/behavior checks |
| Concepts and aligned quizzes | Complete; 71 concepts, prerequisite validation, 18 practice and 33 recorded questions, review links/retry policy |
| Data compatibility and authenticated progress | Complete; additive migrations, stable checkpoints/resume, old data and ownership preserved |
| Integrated verification | Native, content, example, unit, MySQL and development browser checks complete; final production bundle and delivery evidence in verification-update.md |

No feature requirements are intentionally deferred. Native Windows/macOS execution and remote CI remain unobserved in this Linux environment. No publication or deployment is part of this update.
