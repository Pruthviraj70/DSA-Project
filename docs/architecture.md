# Architecture decisions

Status: implementation in progress. Java 21 LTS; Spring Boot 3.5 maintenance line; React/TypeScript/Vite; portable C17 compiled with Emscripten 4.0.18. See lockfiles and POM for exact versions. One backend and one MySQL database.

The browser sends configuration to a dedicated Web Worker, which initializes C and requests bounded batches of at most 32 events. C owns all algorithm mutations and emits state snapshots; TypeScript owns SVG layout and playback. There are no HTTP calls per event. Input limits (32 sequence values, 16 graph vertices, 4096 events) bound CPU, messages and retained history. Cancellation terminates the worker; reset deterministically recreates the initial C state. Backward playback selects an earlier immutable event snapshot, never reverses C instructions.

The backend serves content, authenticates sessions with HttpOnly cookies, validates ownership, grades answers from immutable question revisions and atomically stores attempts and their answers. Requests use the same origin (Vite proxy locally, reverse proxy in Compose); CSRF tokens protect mutations. MySQL credentials exist only on the server. Guest checkpoints and experiments use IndexedDB; after login progress merges by maximum completion and checkpoints are sent only at explicit completion/save/sync boundaries.

A versioned registry binds stable module IDs to C numeric IDs, schemas, adapters, objectives, source locations, examples and assessments. C annotations generate the displayed source directly during builds. No pseudo-C is passed off as execution. Node IDs and edge IDs are conceptual identities, not Wasm memory addresses. Advanced topics are roadmap items only.

See event-protocol.md, database.md and adding-a-module.md for contracts. Required release checks: native correctness/sanitizers, actual browser Wasm/controls, backend security/grading, actual MySQL migrations/transactions and guest/authenticated end-to-end flows. Benchmarks and production deployment are outside acceptance.
