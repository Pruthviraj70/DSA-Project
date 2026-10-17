Build a working first release of DSA Learning Lab from the initial README-only repository. Learners can run 14 released DSA modules through the same portable C17 core used in native tests, compiled to browser WebAssembly and hosted in bounded Web Workers.

The React learning lab provides SVG state/source synchronization, editable and curated inputs, forward/backward playback, predictions, sorting comparison, guest IndexedDB persistence and account synchronization. The Java 21/Spring Boot backend uses normalized Flyway/MySQL storage, BCrypt sessions with CSRF protection, private-record ownership, server-side official grading with historical snapshots, and an instructor report.

Validation:

- 2,168 native C cases under ASan/UBSan, including randomized sorts and graph oracles.
- All 34 operations match native and actual browser Wasm event traces; sorting replay, bounded batches, cancellation and reset are checked.
- 5 frontend unit checks; integrated guest/account browser flows and production Nginx/Compose flows.
- 9 actual-MySQL backend tests covering migrations, security, ownership, grading and rollback.
- Containerized Emscripten, frontend and Java builds; pinned dependencies/wrapper; CI workflows and cross-platform setup documentation.

Read README.md and docs/verification.md for exact commands/results. Advanced curriculum items remain roadmap proposals. Native Windows/macOS runs and remote GitHub Actions execution have not been observed. This change does not deploy or merge anything.
