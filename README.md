# DSA-Project — DSA Learning Lab

A browser-based DSA learning platform powered by **actual portable C17**, compiled to WebAssembly and executed in a Web Worker. Inspect state changes, step through synchronized SVG/source views, predict the next operation, compare sorts, and save learning checkpoints. Guests can explore immediately; accounts provide synchronized progress, saved experiments and server-graded assessments.

## Run

Install Docker Engine/Desktop + Compose v2. On Windows, use the WSL2 Linux-container backend. From this checkout:

```sh
cp .env.example .env
# Replace both password placeholders in .env.
docker compose up --build -d
```

Open the local application on port **8088**. Flyway creates and seeds MySQL automatically. Register an account through the UI; no default user/password is seeded. See [cross-platform setup](docs/setup.md) for Windows PowerShell, macOS/Linux host development, prerequisites, Emscripten setup, proxy support, configuration, migrations and tests.

For host development: Node **24.19.0**, **JDK 21 LTS with javac**, Docker for MySQL, Python 3, and GCC/Clang for native tests. Maven **3.9.11** comes from the checksum-pinned wrapper. Emscripten **4.0.18** comes from the activated SDK or its pinned-version container.

```sh
docker compose up -d db
npm --prefix frontend ci
scripts/build-wasm.sh
# Export DB_URL, DB_USER, DB_PASSWORD from backend/.env.example.
(cd backend && ./mvnw spring-boot:run)
# In another terminal:
npm --prefix frontend run dev
```

The development UI uses port 5173 and proxies `/api` to port 8080. Environment example files contain placeholders only. Never expose DB credentials to frontend code.

## Released modules

| Module | Implemented operations / policy |
|---|---|
| Arrays | create, access, update, insert, delete; zero-based indices |
| Linear search | first matching index; duplicates allowed |
| Binary search | sorted ascending input required; any matching duplicate |
| Insertion sort | stable sorted-prefix insertion |
| Merge sort | stable bottom-up merges with an auxiliary buffer |
| Quicksort | iterative Lomuto, final-element pivot; duplicates go left; not stable |
| Singly linked list | indexed insert/delete, first-match search, traverse; stable conceptual IDs |
| Stack | array-backed push/pop/peek; LIFO, underflow/capacity validation |
| Queue | enqueue/dequeue/inspect; FIFO; this compact implementation shifts on dequeue |
| BST | insert/search/delete, inorder/preorder/postorder; duplicate inserts ignored; successor transplant on two-child deletion |
| Graph editor | add/remove nodes and edges, inspect; directed or undirected integer-weighted graph |
| BFS | reachable outgoing vertices in layer order; ignores weights |
| DFS | explicit stack, deterministic input-order neighbors; ignores weights |
| Dijkstra | shortest distances, zero weights allowed, all negative weights rejected, infinity for unreachable nodes |

Inputs are bounded at **32** sequence values / **16** graph vertices. Graph IDs are unique integers 1..31; self-loops are allowed; setting a parallel edge replaces its weight. Undirected edges are symmetric. Conceptual links/IDs are distinct from browser memory addresses. Every released module uses the C engine; advanced topics appear only in the [curriculum roadmap](docs/roadmap.md).

## Learning workflow

Search the catalog, read objectives/prerequisites/invariants and worked examples, then initialize an editable or curated input. Use play/pause, single-step, backward step, reset and pace controls. Source highlights are extracted from the **same C file that is compiled**, using stable `@loc` identifiers. Relevant state/variables and operation counters follow the selected event; playback duration is a presentation choice.

Prediction checkpoints hide the next event until the learner answers. The comparison view runs insertion/merge/quicksort with identical input in separate workers. Native controls, labels, keyboard operation, responsive layouts and contrast support accessible exploration.

IndexedDB stores guest experiments and pending checkpoints. Login merges progress by maximum completion; failed requests retain newer local progress. Local experiments upload only on an explicit action. Saves happen at completion/checkpoints, not on each animation frame. Guest practice is public formative feedback; official attempts are graded and stored transactionally on the server. Guest activity completion is distinct from official scores.

## Architecture and repository

- **frontend/** — React 19.3.1, TypeScript 5.9.3, Vite 8.3.4, SVG, IndexedDB, Wasm worker and bounded snapshot playback.
- **engine/** — C17 state machines, all algorithm mutations, typed event emission, native correctness/sanitizer tests. Browser glue stays in the worker.
- **backend/** — Spring Boot 3.5.16 on Java 21, Maven wrapper, BCrypt/session/CSRF authentication, Spring Data JPA, explicit transactional SQL, Flyway/MySQL.
- **content/** — versioned registry for all 14 modules, schemas, objectives, adapters, examples and assessments.
- **scripts/** — native/Wasm builds, source extraction, native replay fixtures and seed generation.
- **docs/** — architecture, contracts, database/coursework, setup, extension guide, roadmap and research proposal.
- **.github/workflows/** — native, Wasm, frontend, backend/MySQL and browser verification.

Normal algorithm work runs entirely in the learner's browser. C owns structures and state; TypeScript owns interaction/layout/playback. Spring Boot handles accounts, content, authorization, persistence and grading. There are no server calls per algorithm event or animation frame. One modular backend and one MySQL instance are sufficient for this release.

The worker advances at most 32 events per request. The UI caps history at 4096 full snapshots; backward stepping selects recorded snapshots rather than reversing arbitrary C instructions. Reset recreates the deterministic initial run, and cancellation terminates the worker and rejects pending requests. See [architecture](docs/architecture.md) and [C API/event/source contract](docs/event-protocol.md).

## Verification

```sh
scripts/test-native.sh
python3 scripts/generate-engine-fixtures.py
scripts/build-wasm.sh
npm --prefix frontend test
npm --prefix frontend run build
(cd backend && ./mvnw verify)
# With backend + MySQL running and Playwright Chromium installed:
INTEGRATED=1 npm --prefix frontend run test:e2e
```

See [verification record](docs/verification.md) for executed results and limitations, [release checklist](docs/release-status.md) for milestone evidence, and [setup](docs/setup.md) for test prerequisites. GitHub Actions runs the same relevant checks, including actual MySQL and actual browser Wasm execution. No performance superiority or educational benefit is claimed without measurement.

## Documentation

- [Database ER diagram, dictionary and persistence rules](docs/database.md)
- [SQL coursework: joins, aggregation, report view, indexes and transactions](docs/sql-examples.sql)
- [REST API, authentication and errors](docs/api.md)
- [Adding a module](docs/adding-a-module.md)
- [Future undergraduate curriculum](docs/roadmap.md)
- [Research proposal: prediction versus passive animation](docs/research-note.md)

Release boundaries: no arbitrary user C compilation, email verification/password recovery, high-stakes private exam bank, distributed sessions, or deployment automation. Production use needs HTTPS, secure cookies, appropriate ingress rate limits, backups and secret provisioning. The included container configuration is for local development and review; nothing is deployed or merged by setup.
