Add five complete DSA Learning Lab lessons: Hash Tables, Heaps and Priority Queues, Recursion, Two Pointers, and Sliding Window. This extends accepted main at deb646d4350a2119c4e4747bbbb9186ec2c66a21, which includes the ad342e9 Foundations persistence fix.

Algorithms execute in C17/WebAssembly workers using the existing bounded playback system. New executable and visualization assets load on demand. Implementations cover chaining/probing with updates, tombstones and rehashing; min/max heap operations and shared heap sort; four bounded recursive examples with actual frames/returns; three pointer algorithms; and fixed/variable windows with explicit prerequisites and safe sums.

The catalog now contains 14 lessons, 147 stable pages, 120 concepts and 54 examples in C, C++, Java, Python and JavaScript. Each new lesson includes objectives, prerequisites, worked operations, relevant visualizations, FAQs, practice and server-graded quizzes with review links. Existing themes, accounts, Foundations completion/reversal, password confirmation, quiz feedback, progress and experiments remain shared. Sorting discovers the same heap-sort implementation.

V6 adds repeatable content and compatibility metadata without changing V1–V5 or historical attempts/revisions. Legacy experiment formats remain loadable. New pages/modules start unread. Existing cloud learner-table checksums matched before/after migration, and MySQL upgrade/repeatability tests preserve seeded historical records. The compiler Docker stage avoids duplicating SDK layers on VFS-backed hosts.

Validation performed locally in Codex Cloud:

- 2,170 legacy + 12,968 new native C cases passed with ASan/UBSan.
- Both Emscripten builds passed; all 79 native/Wasm traces matched, with mutation/frame replay, reset, bounded batches and cancellation checks.
- All 270 displayed examples compile; 80 new example executions passed across five toolchains.
- 12 content-validation tests, 14 frontend units and 15 actual-MySQL backend tests passed.
- All 45 integrated development and 39 production browser checks passed without skips; the legacy IndexedDB migration test also passed five focused production runs.
- Formatting, types, production/private-asset checks, both Docker builds/startup and 28 desktop/mobile/light/dark visual captures completed; representative views from every new module were inspected.

Input limits are intentional: integer hashes, at most 32 sequence values/16 initial key-value pairs, factorial 0..12, Fibonacci 0..10. Recursive C computation uses resumable explicit frames; ordinary recursive educational examples have equivalent contracts. Wide diagrams scroll inside their panels. Dijkstra still uses its documented matrix/scan implementation. Native Windows/macOS and remote GitHub Actions results were not observed; the cloud used installed Chromium because the Playwright CDN is unavailable. GitHub API requests currently return Forbidden, so local checks are not described as remote CI success.

See docs/next-modules.md, docs/event-protocol.md and docs/verification-next-modules.md for contracts, reproduction commands, resolved failures and limitations.
