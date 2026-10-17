# Hashing, heaps, recursion and array techniques

Baseline: `main` at `deb646d` contains the accepted first release and the ad342e9 Foundations persistence fix. `feature/dsa-next-modules` extends it without resetting storage. There are now 14 catalog modules, 147 stable lesson pages, 120 concepts, 54 complete examples in five languages, and 91 public-practice/private-recorded questions. The existing Foundations, account, theme and quiz behavior remains shared.

## Learning sequence

| New lesson | Explicit prerequisites | Core concepts |
| --- | --- | --- |
| Hash Tables | Arrays, transitively Foundations | normalized integer hashes; collisions; chaining; probing; updates; unlinking; tombstones; load; incremental rehash; expected/worst-case bounds |
| Heaps and Priority Queues | Arrays | complete trees; parent/child formulas; min/max ordering; insert/peek/extract; bottom-up O(n) build; heap sort; priority-queue uses |
| Recursion | Stack and Searching | termination measures; frames; saved locals; returns; factorial; prefix sum; binary search; branching Fibonacci; total calls versus peak depth |
| Two Pointers | Searching, transitively Arrays | sorted pair elimination; opposite-end reversal; same-direction unique-prefix compaction; physical capacity versus logical length |
| Sliding Window | Two Pointers | contiguous half-open ranges; incremental sums; fixed signed windows; nonnegative variable windows; movement proof and signed counterexample |

Every lesson finishes with specific FAQs followed by its quiz. All assessed concepts occur earlier in that lesson or its prerequisite closure. Teaching text, distractors and explanations were reviewed together: no memoization/dynamic-programming question is introduced, and the Dijkstra queue discussion explicitly describes the existing matrix/scan implementation. Sorting includes a heap-sort page and a direct link to the heap lesson, using the identical runtime operation rather than a second implementation.

## Runtime input contracts

IDs 1–14 and all old operations retain their meanings. New IDs and operations:

| ID / registry ID | Operations (zero-based) | Parameter meaning |
| --- | --- | --- |
| 15 / hash-chain; 16 / hash-probe | 0 build; 1 lookup; 2 upsert; 3 delete; 4 rehash; 5 delete then lookup; 6 delete then reinsert | `values` alternates key,value (≤16 pairs); `arg` is the operation key; `index` is the upsert value or second lookup key |
| 17 / heaps | 0 min build; 1 max build; 2 min insert; 3 min extract; 4 min peek; 5 max insert; 6 max extract; 7 max peek; 8 heap sort | every run builds the input first; `arg` is inserted value; extent excludes the sorted suffix |
| 18 / recursion | 0 factorial; 1 prefix sum; 2 binary search; 3 naive Fibonacci | `arg` is n/target; sum uses the supplied array length; factorial 0..12, Fibonacci 0..10 |
| 19 / two-pointers | 0 sorted pair sum; 1 reversal; 2 sorted unique prefix | `arg` is pair target; unique returns a logical prefix length without clearing physical suffix |
| 20 / sliding-window | 0 fixed maximum sum; 1 variable minimum length | `index` is fixed k in 1..n; `arg` is positive variable target |

Sequence length is ≤32 and integer magnitudes are ≤100000. The form and worker reject unsupported integer/fractional values before crossing the numeric C ABI, avoiding silent coercion or wraparound. Graph-specific constraints apply only to IDs 11–14. Sorted operations reject unsorted input and never silently sort it. Fixed windows accept negative values; the selected variable algorithm rejects them. Empty fixed windows are invalid; empty variable input gives no solution (length 0). Pair results require distinct indices. Wide C sums are used before addition; the stated bounds keep every serialized result within JavaScript's exact integer range. Factorial stops at 12 to remain within signed 32-bit results; Fibonacci's teaching limit prevents excessive repeated work.

Hash capacity starts at eight and doubles before a missing-key insertion would exceed 0.75 live load; explicit rehash also doubles. Buckets are recomputed, tombstones removed, and live entry IDs retained. Duplicate insertion updates the value. Missing status is independent of stored zero. Probes are bounded by capacity. Chains use entry IDs and links; these are conceptual identities, not addresses. A run rebuilds its supplied initial pairs; **Use live entries as fresh input** retains logical entries but reconstructs layout and drops old tombstones. At most 16 live pairs can seed a subsequent input. The delete-then-lookup operation demonstrates tombstone reachability within one continuous run.

Min/max heaps use strict priority comparisons; tied children choose left, while equal-priority records have no stability promise. The displayed counts include initial bottom-up construction. Per-operation O(log n)/O(1) explanations assume an existing heap. Heap sort is ascending with a max-heap and is unstable.

Recursion is actual resumable C computation: explicit call frames retain program continuations between bounded worker requests, instead of retaining the native call stack between messages. Each call/return transition computes and stores real values. The five-language educational examples use ordinary recursive functions with equivalent contracts. The recursion view shows active frames and a hierarchical call tree with stable parent/child IDs. Depth ≤34, calls ≤512 (the allowed Fibonacci maximum actually makes 177 calls), events <4096. No infinite recursion or arbitrary user C compilation is provided.

## Storage and compatibility

V1–V5 are unchanged. V6 adds guarded concepts, lessons, slides, algorithm versions and revision-1 questions for new stable question IDs. Existing recorded revisions, attempts, snapshots, experiments and accounts are untouched. Sorting ordinal metadata moves safely via a temporary offset so a new page can precede its FAQs without changing any old slide ID. The compatibility test replays V4 and V6 and verifies row counts and legacy learner data.

The experiment format identifier is internally 1.2.0; 1.0.0 and 1.1.0 remain loadable. New runtime versions are added for all algorithms so old modules can also save in the current format. New progress starts empty. Old complete Sorting progress does not automatically complete the newly added heap-sort page. Guest/account merge policy and Foundations' explicit completion/reset generations are unchanged. Inputs, operation, pace and format version are saved, not all animation frames.

## Authoring and verification

`content/curriculum.json` is the lesson/concept source; `content/modules.json` describes runtime operations. `content/examples/next/` contains independently compilable example implementations and metadata; `scripts/build-examples.py` includes them in the generated example bank. Historical V4 sources live under `content/history/`; its generator never reads the expanded current curriculum. `scripts/build-next-migration.py` generates V6 during this release's authoring. Once V6 is applied/published, freeze it and use V7 for future changes; do not regenerate an applied migration against future content.

Run `scripts/validate-content.py` and `scripts/test-content.py` to check prerequisite closure, quiz placement, example/runtime references and language coverage. Run `scripts/test-native.sh`, `scripts/generate-engine-fixtures.py`, `scripts/build-wasm.sh`, both example test scripts, frontend checks, Maven verify and integrated Playwright checks. See `verification-next-modules.md` for observed results and environment limitations. No benchmark or educational-benefit claim is made.
