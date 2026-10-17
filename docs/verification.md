# Verification record

Release validation machine: Linux amd64; Java 21.0.12.1 full JDK, Maven wrapper 3.9.11/3.3.4, Node 24.19.0, Emscripten 4.0.18 Docker compiler, GCC C17 and installed Chromium through Playwright 1.64.1. Exact frontend versions/integrities are in package-lock.json; Boot 3.5.16 controls backend transitive versions.

## Executed checks

| Check | Outcome |
|---|---|
| Initial vertical slice | 5 native sanitizer cases and 1 actual Chromium/Wasm insertion test passed before expansion |
| Native C correctness + ASan/UBSan | 2,168 cases passed; randomized sorting, directed/undirected reachability and Floyd–Warshall oracle, structure edge cases, BST deletion/transplant, capacities, event budget, reset and cleanup |
| Native protocol/replay fixtures | 34 operation traces generated; independent sorting write/swap replay checked |
| Browser Wasm parity/lifecycle | All 34 traces matched actual worker/Wasm output; reset, 32-event cap, cancellation passed |
| Frontend unit checks | 5 passed; includes schemas, limits, default isolation, parsing and integer graph validation |
| Backend/MySQL | 9 tests, zero failures/errors/skips against mysql:8.4.6 Testcontainers; real migrations/seed, hashes/sessions, validation/CSRF, ownership, grading/snapshots, transaction rollback, progress merge and instructor authorization |
| Integrated development browser | 11 passed, zero skips; guest/authenticated paths, concurrent IndexedDB monotonic updates and removed-value event regression |
| Emscripten + frontend production build | Passed; staged source/engine publication and exact emission-line mapping verified in actual browser |
| Container build and API | Both images built; Compose API returns 14 modules. Optional trusted-proxy BuildKit secrets used in this cloud network |
| Production browser | 8 passed, zero skips against the final Nginx/Compose bundle. An earlier source.json permission failure was diagnosed and corrected |
| GitHub Actions | Workflow configured; remote execution has not been observed |

## Diagnosed environment issues

- npm's default home cache was unwritable: used `/tmp/dsa-npm-cache`.
- The host had a Java runtime without a usable JDK compiler: installed a full trusted Temurin Java 21 JDK in ignored `.tools/`.
- Maven needed the platform HTTPS proxy and trusted system Java CA store; supported proxy/trust configuration restored normal TLS-verified downloads.
- Playwright's browser CDN returned `403 Domain forbidden`: used installed `/usr/bin/chromium` through `CHROMIUM_PATH`. No browser engine was mocked.
- The cloud uses Docker's `vfs` driver and a 32 GB overlay. Initial full builds exhausted space; reduced build layers, built components separately and removed only task-created build caches/unused image artifacts. No application data volume was removed.
- Docker build containers needed the platform proxy's existing hostname mapping. Optional local proxy/trust settings were passed with BuildKit secrets and a local extra_hosts override. No credential values were committed, printed or copied into runtime images, and TLS/checksum verification stayed enabled.

No native/Wasm-versus-JavaScript performance benchmark or educational outcome study was performed. No claim of superiority is made. Windows/macOS native host setup is documented but has not been run on those machines.

Final checks also passed formatting, shell syntax, documentation link resolution, and git diff whitespace checks. The final C regression verifies that array deletion reports the captured removed value, independently of the unused argument. Emscripten 4.0.18 manifests include Linux amd64 and arm64; native Windows/macOS execution remains unverified.

## Delivery

Feature branch and meaningful local commits exist. GitHub API read returned `Forbidden`; push/draft-PR publication attempt is the remaining delivery step. No merge, force-push or deployment is performed.
