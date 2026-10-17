# Lesson redesign verification (2026-10-17)

This record covers the update on `feature/dsa-learning-lab`, separately from the original release evidence in verification.md. The attached checkout is `/workspace/DSA-Project`; `/Users/pruthviraj/DSA-Project` is not mounted in this environment. Initial status was clean. Existing instructions/content were inspected before edits; no temporary project README was recreated. No push, merge or deployment is authorized for this update.

## Completed implementation

- Tile home, Foundations above Data Structures/Algorithms columns, compact header and home-return logo on every screen; persistent module sidebar removed.
- Nine grouped modules, 87 stable slides, 71 concepts, operation-specific lessons, substantive FAQs immediately before final quizzes, prerequisite recommendations and teaching-page review links.
- Foundations includes counts/growth/call-stack visuals; array memory shows illustrative contiguous addresses and language-abstraction caveats.
- 38 complete educational example sets in C/C++/Java/Python/JavaScript, alternatives, cost/preconditions, syntax highlighting, copying and persistent preference. Executed-source panel/wiring/public asset removed. No unrelated example execution highlights.
- Existing actual C/Wasm worker playback, predictions/comparison and graph editing retained. Array traversal is an actual new bounded C operation. Internal runtime 1.1.0 accepts old saved inputs.
- Additive Flyway V3/V4; stable slide progress/resume; non-destructive IndexedDB upgrade; server-only recorded grading; distinct local practice; historical snapshots and old experiments/percentages preserved.

## Executed evidence

| Check | Result |
|---|---|
| Native C17 + AddressSanitizer/UndefinedBehaviorSanitizer | 2,170 cases passed, including full array traversal with value 100000 and empty traversal |
| Native trace/replay oracle | 35 operation traces generated; sorting write/swap replay validated |
| Emscripten 4.0.18 container build | Passed; real JS/Wasm outputs generated, source-location diagnostics retained only in .build |
| Frontend unit tests | 7 passed |
| Curriculum validation | Nine modules, 71 concepts, 51 aligned questions (18 public practice / 33 recorded) |
| Validator negative tests | 9 passed: missing/cyclic prerequisites, unknown/untaught concepts, post-quiz material and bank isolation |
| Backend Maven verify / actual MySQL 8.4.6 | 12 passed, zero failures/errors/skips; validation, CSRF, ownership, grading/retry/snapshots, rollback, stable slide progress, both saved-input versions |
| V2 populated database upgrade | Passed in disposable actual MySQL; user/role/hash, old attempt/answers, old percentage and saved JSON unchanged; new slides unread; repeating V4 creates no duplicate rows |
| Development browser acceptance | 18 passed, zero skips, with actual Spring Boot/MySQL and Chromium; all lesson pages audited, real Wasm parity/lifecycle, guest/account flows and persistence |
| Multilingual examples | All 190 independent examples compiled; behavioral cases passed in C, C++, Java, Python and JavaScript, including create/copy independence |
| Frontend build/format and static isolation | Passed; no recorded prompts/private banks or obsolete source asset; Vite denies direct private-bank/backend file requests |
| Local production containers | Frontend and backend images built sequentially; Compose started using the retained MySQL volume |
| Production browser | 13 passed, zero skips through Nginx/Compose; final check follows the final implementation commit |
| Desktop/mobile inspection | Home, array introduction/operation, graph lesson, FAQs and quiz inspected at 1440px/390px; outer graph vertices fit mobile; visible focus and reduced-motion styles supplied |

All 190 displayed examples compiled independently, and representative behavior passed in all five language toolchains; native example harnesses used sanitizers. Updated create/copy independence cases also passed. Frontend formatting/build and static bundle isolation passed; direct Vite requests for both private banks and backend migrations returned 403.

The initial parallel container build exceeded this machine’s 32GB root filesystem with Docker’s vfs storage driver (`java.io.IOException: No space left on device`). A concurrent browser invocation also stopped with ENOSPC before running tests. Unused build cache was cleared without removing any volume; building frontend then backend separately succeeded. The completed development suite was rerun with no skips. Earlier test failures were corrected: old-interface selectors, retry-fetch timing, an incorrect fixed insertion-step count, and an exact punctuation expectation. A running local server initially read a JAR replaced by Maven repackaging; the final verification server runs an immutable copy. These are not reported as successful runs.

The development MySQL volume was preserved. A restricted-permission local SQL backup was taken before applying the update. Tests add disposable learner accounts; no existing user records were removed or reset. Testcontainers databases are independent of development storage.

## Reproduce

Use docs/setup.md and `scripts/check.sh`, with JDK 21 (including javac), Node 24.19.0, Python 3, gcc/g++, Docker and Playwright Chromium. `CHROMIUM_PATH=/usr/bin/chromium` was used here because the Playwright browser CDN is blocked. No Windows/macOS native-machine testing or remote GitHub Actions execution is claimed. The configured CI runs native/Wasm, content/example, frontend, backend/MySQL, development browser and production Compose checks.


## Delivery and practical limits

All requested application features are implemented. Native Windows/macOS hosts and remote GitHub Actions were not available for observation; cross-platform launch instructions and CI checks are supplied. No educational efficacy or performance superiority is claimed. There is no arbitrary user-submitted compilation.

The feature branch remains local for this update. Nothing was pushed, merged or deployed. Use `git log -2 --oneline` and `git status --short` for the final local delivery commits/state. Local review is available at `http://localhost:8088` through Compose; host development uses `npm --prefix frontend run dev` with backend/MySQL already running. Standard launch from a fresh configured checkout is `docker compose up --build -d`; preserve the existing `.env` and volume on upgrade.
