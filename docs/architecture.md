# Architecture decisions

Status: implemented and locally verified; see verification.md. Java 21 LTS; Spring Boot 3.5 maintenance line; React/TypeScript/Vite; portable C17 compiled with Emscripten 4.0.18. See lockfiles and POM for exact versions. One backend and one MySQL database.

The browser sends configuration to a dedicated Web Worker, which initializes C and requests bounded batches of at most 32 events. C owns all algorithm mutations and emits state snapshots; TypeScript owns SVG layout and playback. There are no HTTP calls per event. Input limits (32 sequence values, 16 graph vertices, 4096 events) bound CPU, messages and retained history. Cancellation terminates the worker; reset deterministically recreates the initial C state. Backward playback selects an earlier immutable event snapshot, never reverses C instructions.

The backend serves content, authenticates sessions with HttpOnly cookies, validates ownership, grades answers from immutable question revisions and atomically stores attempts and their answers. Requests use the same origin (Vite proxy locally, reverse proxy in Compose); CSRF tokens protect mutations. MySQL credentials exist only on the server. Guest checkpoints and experiments use IndexedDB; slide completions merge monotonically and account resume positions take precedence over imported guest positions. Checkpoints occur on page navigation, explicit completion, submission and sync boundaries. Legacy percentage records are preserved separately.

Two registries separate runtime IDs/schema/adapters from stable teaching module/slide/concept IDs. The nine teaching modules group fourteen runtime modules. Educational example libraries provide complete, separately tested C/C++/Java/Python/JavaScript functions; selecting a language changes examples only. C annotations produce internal source-location diagnostics, never learner-facing execution highlights. Official questions and keys remain in backend migrations/private authoring data; guest practice is a distinct public bank. Node IDs and edge IDs are conceptual identities, not Wasm memory addresses. Advanced topics are roadmap items only.

See event-protocol.md, database.md and adding-a-module.md for contracts. Required release checks: native correctness/sanitizers, actual browser Wasm/controls, backend security/grading, actual MySQL migrations/transactions and guest/authenticated end-to-end flows. Benchmarks and production deployment are outside acceptance.


The header links to topics, progress, saved experiments and account screens. Hash routes `#/lesson/<module>/<slide>` preserve history and deep links without reloads. A missing slide resumes a valid stored position. The UI hides implementation labels/versions and converts internal errors into helpful learner messages; raw failures go only to developer diagnostics. Syntax grammars/examples load lazily when needed. SVG remains sufficient; no Canvas infrastructure was added.

`content/curriculum.json` declares concepts taught per slide and prerequisite edges. Validation rejects cycles, unknown IDs, out-of-closure assessment concepts and misplaced quizzes. Every lesson ends with FAQs immediately before its quiz. Editorial review must additionally check assumptions in prompts, distractors and explanations. [Authoring contract](lessons.md).

Completion generations and manual Foundations status are learning metadata, separate from C/Wasm state and assessment scores. A pre-paint theme bootstrap and semantic CSS/SVG variables handle appearance entirely on the client. See [learning preferences](learning-preferences.md).
