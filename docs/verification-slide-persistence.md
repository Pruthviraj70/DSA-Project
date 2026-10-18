# Slide completion persistence investigation — 2026-10-18

Investigated `frontend/e2e/next-modules.spec.ts:46`, the recursion execution/replay/restoration case, on `feature/dsa-next-modules` at `c0f8b88e52d81b2c2184160c6c615c46ed599861`. An explicit fetch confirmed the local branch and origin matched. The remote is `Pruthviraj70/DSA-Project`; no AGENTS.md was present in the checkout or its parent. All work used the cloud checkout.

## Cause and evidence

GitHub Actions API access returned `Forbidden`, preventing download of the reported CI screenshot, error context and trace. The original focused production test passed locally once. A controlled IndexedDB transaction gate then reproduced the reported missing completion after reload:

1. Open `recursion/branching`, run the real Wasm visualization to completion, step backward and forward.
2. Click **Mark page complete** while holding its actual slide write transaction open.
3. The old UI reports **✓ Page complete** and counts the page as completed despite the transaction remaining uncommitted.
4. Reload aborts that transaction. The same URL and page selector restore `recursion/branching`, but the stored slide row has `completed: false` and the indicator says **Reading in progress**. No practice attempt exists.

The local diagnostic captured `/tmp/recursion-uncommitted.png`, `/tmp/recursion-error-context.md` and `/tmp/recursion-race-trace.zip`. The screenshot, page context and trace sequence were inspected. Two new transaction-gated regressions failed against the unchanged production bundle (diagnostics under `/tmp/slide-regression-before/`): manual completion acknowledged too early; Next navigated before commit. These are cloud-local diagnostics, not downloaded CI artifacts.

`useLearning.checkpoint` updated React completion state before awaiting `lessonStorage.checkpoint`, whose promise already correctly resolves on `transaction.oncomplete`. The Foundations fix `ad342e98ffc43f12ea2dfccc95b2a42f240ea909` addressed its separate manual-module flag, not slide checkpoints. This investigation establishes an acknowledgment-before-commit bug; no evidence showed a renamed label, wrong restored slide, or replay clearing progress. Without the CI trace, the exact timing of that remote run cannot be independently confirmed.

## Change

Slide completion and in-memory resume state now update after commit. Owner and progress-generation checks prevent a late save from acknowledging completion for a different account or a reset pass. Local persistence still starts immediately, independently of slow server synchronization. Network synchronization, pending stamps, monotonic completion, import receipts and Foundations resets keep their existing policy.

Lesson controls expose **Saving page…** and disable duplicate completion/Next actions while saving. Next advances only after a successful checkpoint; a failure leaves the learner on the original page with an error and retry available. A delayed Next action cannot replace a different page the learner opens meanwhile. The completion indicator has the accessible status name **Page progress**.

The execution/restoration tests now wait for that durable acknowledgment before immediate reload, assert the stable slide ID, and inspect committed storage to verify exactly the requested page was completed, without artificial module flags, percentage checkpoints or practice attempts. New deterministic tests gate and abort real transactions, retry, reload, replay, step backward and reset. An authenticated test verifies local completion during unavailable synchronization, subsequent actual server synchronization, zero attempts and fresh-browser restoration while a server progress read is deliberately delayed. It transfers session cookies, not IndexedDB.

No backend, migration, C, worker or saved-experiment format changed. No existing database data was reset or removed.

## Cloud-local checks

- Focused recursion test and three new regressions: **4 passed**.
- Relevant existing navigation, progress, Foundations and experiment-preservation tests: **8 passed**.
- IndexedDB monotonicity, acknowledgment, stale-response/reset protection and actual browser Wasm/native trace/worker tests (`engine.spec.ts`): **7 passed**.
- Frontend unit tests: **15 passed**.
- Formatting, TypeScript/production build and public-asset isolation: **passed**.
- Complete production-browser suite: **42 passed, no skips** (39 existing tests plus three regressions).

The freshly compiled production bundle was copied into the existing production Nginx container (with its normal readable permissions); the existing backend image and MySQL data volume were reused. Production browser checks exercise real backend/MySQL requests and actual C/Wasm execution. C and backend source are unchanged, so native compilation and Maven suites were not rerun for this frontend-only fix. No cloud-local result is presented as a GitHub Actions result.

```sh
BASE_URL=http://127.0.0.1:8088 CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 \
  npm --prefix frontend run test:e2e -- e2e/next-modules.spec.ts \
  --grep 'recursion uses real|waits for the slide transaction|account page completion'
BASE_URL=http://127.0.0.1:8088 CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 \
  npm --prefix frontend run test:e2e -- e2e/learning.spec.ts e2e/authenticated.spec.ts \
  e2e/preferences.spec.ts --grep 'navigation.*refresh|Foundations|login merges|IndexedDB upgrade'
BASE_URL=http://127.0.0.1:8088 CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 \
  npm --prefix frontend run test:e2e -- e2e/learning.spec.ts e2e/slice.spec.ts \
  e2e/authenticated.spec.ts e2e/preferences.spec.ts e2e/next-modules.spec.ts
CI=1 CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 \
  npm --prefix frontend run test:e2e -- e2e/engine.spec.ts
npm --prefix frontend run format:check
npm --prefix frontend test
npm --prefix frontend run build
python3 scripts/check-public-assets.py
```

Logs for this task: `/tmp/slide-focused-final.log`, `/tmp/slide-progress-final.log`, `/tmp/slide-production-final.log`, `/tmp/slide-storage-wasm.log`, `/tmp/slide-unit.log`, `/tmp/slide-format.log` and `/tmp/slide-build.log`. Temporary diagnostics and logs are local task artifacts, not committed project files.
