# Lessons, examples and assessment coverage

The catalog has fourteen teaching modules and twenty runtime families. These are different registries: `content/curriculum.json` owns the course sequence; `content/modules.json` owns runtime IDs, input schemas and adapters. Stable slugs bridge them without renumbering C modules or invalidating experiments. Curriculum registry schema is version 2; runtime compatibility metadata stays internal.

## Lesson contract

A module declares `id`, title, category, icon, description, prerequisites and slides. Use `Foundations`, `Data Structures` or `Algorithms` categories as appropriate. Existing Foundations is prominent above the two catalog columns. A slide declares a stable `id`, title, kind, paragraphs and `teaches` concept IDs; it can additionally bind bullets, FAQs, an `exampleId`, a concept visual or a runtime operation. Do not persist ordinal positions: reordering pages must preserve their keys. URLs are `#/lesson/arrays/insert`, for example. Module-only URLs resume a valid saved position; old individual algorithm slugs map through registry aliases.

Sequence each module through motivation, representation/terminology, individual operations, variants/edge cases, FAQs, then one final quiz. FAQs must immediately precede the quiz. Teach every assessed idea before the quiz or in an explicit prerequisite. Introductory pages can omit code. Runtime bindings activate one operation, with focused controls, while preserving C ownership of all state changes. `inputForSlide` builds only protocol fields. `Lesson`, `Playground`, `CodeExample`, `ConceptVisual` and `Assessment` are reusable presentation components.

Foundations teaches inputs/outputs/correctness, pseudocode/invariants, values/indices/memory, input size/counts, time and auxiliary space, O/Ω/Θ, growth patterns, cases versus bounds, loops and recursion. Its counts, growth and stack visuals are conceptual teaching models, distinct from executable algorithm traces. The array memory model uses illustrative contiguous addresses and explicitly distinguishes language collection abstractions.

## Multilingual examples

Author actual readable functions in `content/examples/examples.c`, `Examples.cpp`, `Examples.java`, `examples.py`, and `examples.js`. Marker sections use `shared:<type>` and `example:<stable-id>`. Shared types and cleanup/setup are included by `scripts/build-examples.py`; the generated `content/examples.json` is the browser artifact. Graph operations appear before construction helpers after the required type definitions, so the relevant algorithm is easy to find. Java snippets are complete `Example` classes; the combined test library is `Examples`.

Add metadata in the builder: title, preconditions, edge cases, complexity conventions and meaningful alternatives. Code must show the algorithm rather than delegate the taught operation to a library. Library storage/allocation primitives remain appropriate. State ownership and initialization: C/C++ linked nodes require cleanup; Java/Python/JavaScript head/root mutations return replacements. Fixed arrays, growable collections, shift-based queues and circular queues have different allocation/cost rules and must be described accurately. Preconditions such as sorted binary-search input and nonnegative Dijkstra weights are explicit. Duplicate policies and missing-result/underflow behavior must be clear.

Run:

```sh
python3 scripts/build-examples.py
python3 scripts/test-examples.py
```

The check compiles all 190 displayed examples independently (C17, C++17, Java 21, Python 3, JavaScript) and runs representative behavioral cases in all five languages, with native sanitizers. Harnesses cover shifting, duplicates, empty searches/sorts, linked head changes, stack/queue order and underflow, circular wraparound, BST deletion and disconnected/zero/negative-weight graphs. Extend behavioral coverage with new examples. The browser uses Prism syntax tokens, a language selector and clipboard copying. `dsalab.exampleLanguage` stores preference locally. No example line is presented as an executed instruction; language changes do not change visualization execution.

## Concepts and quizzes

Concepts have stable IDs such as `arrays.insert` or `foundations.bounds`. Slides declare the concepts they teach; each question declares concepts it assesses and a positive revision. Prerequisite closure is transitive. `scripts/validate-content.py` rejects unknown/duplicate references, invalid or cyclic prerequisites, invalid final quiz placement, empty teaching content and questions outside the concepts taught before the quiz in the module/prerequisite closure. `scripts/test-content.py` exercises negative cases. Metadata validation supplements editorial review: read each prompt, distractor and explanation for hidden assumptions, prerequisites and accessible wording.

`content/practice.json` contains distinct public local-practice questions and keys. `content/assessments.private.json` is authoring data for authenticated recorded quizzes; never import it into frontend code. Official keys/explanations live in backend migrations. “Private” here means excluded from the learner bundle and development file server; repository readers can inspect authoring data and migrations, so this is not a high-stakes secret exam system. Vite denies private banks and backend files, and `scripts/check-public-assets.py` checks the built bundle for recorded prompts/private banks and obsolete source assets. The unauthenticated question API may return official prompts/options/concept IDs, but never keys or explanations. Feedback is returned after authenticated submission.

Guest practice results persist locally for the matching question revisions. Recorded submissions require one answer per active revision; the server grades them transactionally and snapshots their text/explanations. Every retry starts unanswered; unlimited retries create separate recorded attempts without replacing old results. Feedback links through concept mappings to relevant teaching pages. Quizzes describe the assumed unmet prerequisites while allowing free exploration. Completion means participation, not a passing score.

For this update V4 is reproducible with `python3 scripts/build-curriculum-migration.py`. After release, add a new append-only Flyway migration for new pages/revisions/concept mappings and active-bank changes; do not rerun generators to alter applied V4. Preserve old revision/options rows and attempt snapshots. A changed question uses a new revision, not an in-place edit. Update active `curriculum_questions` pointers deliberately in the new migration.

## Progress and verification

Completion acknowledgments wait for the local IndexedDB transaction to commit. **Saving page…** disables duplicate completion/Next actions; Next advances only after its checkpoint commits. A failed write leaves the page incomplete and allows retry. **✓ Page complete** means an immediate reload can restore that completion from this device; authenticated server synchronization still runs separately with pending checkpoints retried under the existing merge policy. Playback, backward stepping and reset never clear learning progress.

Opening pages saves resume positions. Next or explicit completion marks that teaching page complete; a submitted quiz marks its participation page complete. A page selector jump does not complete skipped pages. Back, refresh and deep links retain stable URLs. IndexedDB version 2 adds stores while preserving old ones. Login unions guest slide completions and seeds missing account positions; existing account positions take precedence. Legacy percentage activity never completes new pages. See database.md for transactions, owner isolation, stale-response protection and 1.0.0 experiment compatibility.

Run content checks, example checks, native/Wasm parity, frontend units, backend/MySQL and integrated browser tests. Browser acceptance covers the tile catalog, all lesson pages/labels, logo routes, navigation/restoration, preferences/copy, practice/recorded quizzes/review, migration preservation and playback. Inspect new slides at desktop/mobile widths, check focus/reduced-motion behavior, and verify that animation emits no HTTP requests. Never label planned curriculum topics as functional.

Foundations additionally supports explicit module completion and new-pass resets; generation-aware progress and merge receipts are documented in [learning preferences](learning-preferences.md). Keep manual status distinct from actual page completion and official scores when extending these controls.

The five new lessons and their explicit prerequisite closure are documented in [next-modules.md](next-modules.md). The content validator also rejects missing examples/languages, invalid runtime operations and new operations without a teaching page. Runtime variants can use separate stable slides without duplicating home tiles. `related` links connect a teaching page to another lesson, such as Sorting to Heaps.
