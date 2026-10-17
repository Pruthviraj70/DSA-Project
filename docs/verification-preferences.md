# Learning preferences verification — 2026-10-17

Scope: reversible Foundations completion/home visibility, confirmed five-character registration, selected incorrect-answer feedback and system-aware light/dark appearance. Work is confined to `/workspace/DSA-Project` in Codex Cloud, based on the fetched `feature/dsa-learning-lab` commit `a9a3c81dd7f6ae459e9aec52ffe0eff0b123658c`. Initial working tree was clean; no repository AGENTS.md was present. No MacBook or its services were accessed.

## Checks performed

| Check | Observed result |
|---|---|
| Native C with AddressSanitizer/UndefinedBehaviorSanitizer | 2,170 cases passed; core source/API unchanged |
| Browser Wasm parity/lifecycle | 35 operation traces matched native fixtures; bounded batches, reset, cancellation and playback passed |
| Frontend units | 10 passed, including minimum/matching passwords and UTF-8 maximum |
| Frontend formatting/type/build | Passed; includes pre-paint public theme bootstrap |
| Curriculum validation and negative checks | Nine modules, 71 concepts, 51 aligned questions; 9 negative/coverage tests passed |
| Static bundle isolation | No recorded question prompts/private banks or obsolete executed-source asset |
| Actual MySQL 8.4.6 / Maven verify | 14 passed with no failures/errors/skips; includes manual completion without fake attempts/pages, reset action idempotence, stale-generation rejection, account isolation/CSRF, five-character passwords without composition rules, maximum byte guard, hashes and legacy migration preservation |
| Integrated development browser | 29 passed with no skips before final production review; covers guest/account manual and normal completion, refresh/merge, delayed account restore without introductory flash, reset preserving six recorded answers, password request shape/mismatch, guest and recorded selected-only grading, retry clearing, theme/system/persistence, light/dark SVG colors and 1440px/390px contrast/overflow checks |
| Visual inspection | Home, array memory/code, graph, recursion stack, graded quiz and registration captured at desktop/mobile in both themes; 28 views checked for horizontal overflow; representative screenshots inspected |

The original C/Wasm workload remains in its worker; playback assertions continue to verify no `/api` requests for animation steps. All V1–V4 migrations remain unchanged. V5 is additive; a restricted-permission cloud SQL backup was taken before applying it to the existing cloud development database. No volume, learner, saved experiment or historical assessment was removed.

Initial failures were investigated rather than counted as passes: a browser run overlapped local backend startup, and one new guest normal-completion test attempted submission before its questions loaded. The test now waits for the expected question count. Completed reruns are the evidence above.

## Reproduce and limits

Use README.md and docs/setup.md, JDK 21 with javac, Node 24.19.0 and Docker/MySQL. Run `npm --prefix frontend run format:check`, `npm --prefix frontend test`, `npm --prefix frontend run build`, `(cd backend && ./mvnw verify)` and `INTEGRATED=1 npm --prefix frontend run test:e2e` after starting the cloud-local backend/MySQL. Existing installed Chromium was selected with `CHROMIUM_PATH=/usr/bin/chromium`; the Playwright browser CDN remains unavailable in this environment.

Native Windows/macOS machines and remote CI were not used. No performance or educational efficacy measurement is claimed. Completion resets deliberately start a new page-progress pass while retaining assessment history. Explicit cross-device completion conflicts return a Sync/retry message rather than overwriting newer progress silently.

Production container review and publishing results will be recorded after their commands finish. The intended destination is a reviewable feature branch with a draft PR targeting `feature/dsa-learning-lab`. No merge, force push or deployment is part of this task.
