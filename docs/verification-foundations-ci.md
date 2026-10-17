# Foundations completion CI investigation — 2026-10-17

Investigated the reported production-browser failure in `e2e/preferences.spec.ts` against clean branch `feature/dsa-learning-preferences` at `b340f4fcd71cf1cbd5013d60717188daa1a8bc2e`. Origin was verified as `Pruthviraj70/DSA-Project`; an explicit branch fetch confirmed identical histories. No AGENTS.md was present in the cloud checkout or its parent. No MacBook services were accessed.

## Evidence and cause

The message **Foundations completed.** still exists in the Foundations lesson, beside its completion controls. It was neither renamed nor moved away from that lesson. Navigation restores stable slide IDs. Module completion is a manual module flag or completion of all current pages, independently of quiz score. Guest state lives in IndexedDB; authenticated state queues the same module flag for the backend and uses the existing per-account guest-import receipts and progress generations.

The original focused test passed five serial runs and 30 concurrent repetitions locally. The original 24-test production suite also passed. These runs alone did not reproduce the reported CI failure.

A controlled storage diagnostic did expose a real durability race: `setFoundationCompletion` changed React state before awaiting `lessonStorage.putModule`, whose promise resolves on the IndexedDB transaction's `oncomplete`. The introduction could therefore disappear while its write was still uncommitted. Holding that transaction open, then reloading, lost the flag. The restored lesson showed **Foundations is in progress.**, **Mark completed**, and **0 / 13 pages complete**, explaining how the reported text locator can be absent. The old post-reload `toHaveCount(0)` assertion could also pass during initial loading, before restoration decided whether to show the introduction.

The diagnostic captured a trace and screenshot locally (`/tmp/foundations-uncommitted-trace.zip`, `/tmp/foundations-uncommitted.png`). Its screenshot was inspected. The new transaction-gated regression failed against the unchanged production image; its error context and trace are in `/tmp/foundations-regression-before/`. The gate waits for a real transaction event and is explicitly released by the test; no sleeps, longer timeouts or retries were added.

GitHub Actions API access returned `Forbidden`, so the original CI logs and artifacts could not be downloaded. The production job previously uploaded no browser artifacts and Playwright did not retain traces/screenshots by default. Thus the exact original CI timing cannot be proven from its artifacts; the uncommitted-write race is locally demonstrated, rather than inferred solely from the locator failure. The installed system Chromium is used because the Playwright browser CDN is unavailable here; it is not an exact reproduction of GitHub's runner/browser image.

## Fix and assertions

Completion and reset now publish their visible state after the local transaction commits. Controls remain disabled while saving and, for signed-in learners, while synchronization is pending. The existing backend synchronization, merge policy, reset generations and all-page normal completion rule remain unchanged. A failed local save leaves the prior state intact. No schema, assessment history or algorithm execution changes are needed.

The manual-completion test checks the accessible **Foundations completion** region and **Mark incomplete** action, rather than incidental paragraph wording. It verifies the rendered Arrays lesson before checking prerequisites, persisted manual flags and generations across reload/reset, no completed slide flags, no practice result or legacy-score records, and continued access through the compact Foundations link. Visiting a page may retain its ordinary incomplete resume record; manual completion creates no artificial completion. The authenticated test additionally checks that the server has no page-progress records immediately after importing manual completion, alongside its existing zero-attempt assertion and later history-preserving normal completion/reset checks.

A second test holds the module transaction open for both completion and reset, asserting that the prior visible state remains until commit. Failure-only screenshots and retained traces now apply to browser checks, and the production job uploads `production-browser-diagnostics` for seven days.

## Verification

| Check | Actual result |
| --- | --- |
| Focused production completion and transaction-gate tests | 2 passed |
| Full production-browser suite | 25 passed, no skips |
| Full integrated development browser suite | 31 passed, no skips; includes 35 actual Wasm/native trace comparisons and worker lifecycle checks |
| Frontend unit tests | 10 passed |
| Frontend format, TypeScript and production build | Passed |
| Public asset isolation check | Passed |
| Frontend Docker image rebuild and Compose readiness | Passed |

Final local browser logs are `/tmp/foundations-focused-verified.log`, `/tmp/foundations-production-verified.log` and `/tmp/foundations-development-final.log`. Tests cover guest persistence/reversal, authenticated synchronization and delayed restoration, preserved quiz history, existing experiment migrations, and working visualization controls. Backend unit/integration binaries were not rerun because server code and migrations are unchanged; the browser suites exercised the running backend against actual MySQL.

Existing database contents and the original MySQL volume are preserved. Only the frontend test container was rebuilt/recreated. Unused Docker build cache was pruned after rebuilding to stay within the cloud disk limit; no data volumes were pruned.

```sh
# Running cloud-local Compose frontend/backend/MySQL, after readiness checks:
BASE_URL=http://127.0.0.1:8088 CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 \
  npm --prefix frontend run test:e2e -- e2e/preferences.spec.ts \
  --grep 'manual Foundations|wait for the local transaction'
BASE_URL=http://127.0.0.1:8088 CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 \
  npm --prefix frontend run test:e2e -- e2e/learning.spec.ts e2e/slice.spec.ts \
  e2e/authenticated.spec.ts e2e/preferences.spec.ts
CHROMIUM_PATH=/usr/bin/chromium INTEGRATED=1 npm --prefix frontend run test:e2e
npm --prefix frontend run format:check
npm --prefix frontend test
npm --prefix frontend run build
python3 scripts/check-public-assets.py
```
