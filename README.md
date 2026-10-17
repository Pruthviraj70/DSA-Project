# DSA-Project — DSA Learning Lab

An interactive learning platform with a tile-based topic catalog, slide lessons, visual experiments, prediction exercises and quizzes. Start with Foundations, then explore data structures and algorithms at your own pace. Guests keep their place locally; accounts synchronize page progress and experiments and record server-graded quizzes.

The nine learning modules contain **87 stable pages**, **71 concepts**, **38 example implementations in five languages**, and separate practice and recorded question banks. C, C++, Java, Python and JavaScript selections change the educational example only. The underlying C17/WebAssembly worker remains responsible for every algorithm visualization.

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

## Learning modules

Foundations appears above two responsive catalog columns; no persistent navigation sidebar is used. The application name always returns home. Each module has Previous/Next controls, a contents selector, a shareable/restorable URL, module-specific FAQs and a final quiz.

| Section | Lessons |
|---|---|
| Start here | Foundations: correctness, pseudocode, memory, input size, counts, time/space, asymptotic bounds, cases, growth, loops and recursion |
| Data Structures | Arrays, Singly linked list, Stack, Queue, Binary search tree, Graphs |
| Algorithms | Searching (linear/binary), Sorting (insertion/merge/quicksort and comparison) |

Foundations is a recorded recommended prerequisite. Exploration is open; unmet prerequisites and the knowledge assumed by quizzes are shown explicitly. See [lesson and content authoring](docs/lessons.md).

## Algorithm implementations

| Module | Implemented operations / policy |
|---|---|
| Arrays | create, access, update, traversal, insert, delete; zero-based indices |
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

Choose a tile and move through one coherent lesson. Operation slides pair explanations and complete example functions with the relevant visualization and controls. The first array page includes values, indices, illustrative contiguous addresses, element size and the address formula. Foundations adds interactive operation counts, growth comparisons and a call-stack illustration.

Use Run, Play/Pause, Step, Back, Reset and pace controls. Predictions hide the next action until answered. Sorting comparison uses identical inputs. Counts describe algorithmic actions separately from animation duration. Educational examples have syntax highlighting, alternatives, preconditions, complexity and a copy button; language preference persists locally. They have no misleading execution-line highlights.

A page completes when marked explicitly or when Next is used; submitting a quiz completes its participation page regardless of score. The result records understanding separately. Guest practice is local and distinct from recorded assessments. Unlimited retries create separate recorded attempts; feedback explains answers and links to teaching slides. Official keys are supplied only after submission and never bundled in frontend assets.

IndexedDB upgrades preserve earlier experiments and checkpoints. Login unions explicit slide completions; a guest resume position only seeds an account without a position for that lesson. Existing account positions win. Legacy percentages remain prior activity and never automatically complete newly authored slides. Save points occur at page/checkpoint boundaries, with no HTTP calls for playback actions. See [compatibility and progress rules](docs/database.md).

## Architecture and repository

- **frontend/** — React 19.3.1, TypeScript 5.9.3, Vite 8.3.4, SVG, IndexedDB, Wasm worker and bounded snapshot playback.
- **engine/** — C17 state machines, all algorithm mutations, typed event emission, native correctness/sanitizer tests. Browser glue stays in the worker.
- **backend/** — Spring Boot 3.5.16 on Java 21, Maven wrapper, BCrypt/session/CSRF authentication, Spring Data JPA, explicit transactional SQL, Flyway/MySQL.
- **content/** — runtime registry for 14 implementations; curriculum registry for nine lessons; tested example libraries; separate public practice and private recorded questions.
- **scripts/** — native/Wasm builds, internal source diagnostics, native replay fixtures, content validation and example checks.
- **docs/** — architecture, contracts, database/coursework, setup, extension guide, roadmap and research proposal.
- **.github/workflows/** — native, Wasm, frontend, backend/MySQL and browser verification.

Normal algorithm work runs entirely in the learner's browser. C owns structures and state; TypeScript owns interaction/layout/playback. Spring Boot handles accounts, content, authorization, persistence and grading. There are no server calls per algorithm event or animation frame. One modular backend and one MySQL instance are sufficient for this release.

The worker advances at most 32 events per request. The UI caps history at 4096 full snapshots; backward stepping selects recorded snapshots rather than reversing arbitrary C instructions. Reset recreates the deterministic initial run, and cancellation terminates the worker and rejects pending requests. See [architecture](docs/architecture.md) and [C API/event/source contract](docs/event-protocol.md).

## Verification

```sh
python3 scripts/validate-content.py
python3 scripts/test-content.py
python3 scripts/test-examples.py  # gcc, g++, JDK 21, Python 3 and Node required
scripts/test-native.sh
python3 scripts/generate-engine-fixtures.py
scripts/build-wasm.sh
npm --prefix frontend test
npm --prefix frontend run build
python3 scripts/check-public-assets.py
(cd backend && ./mvnw verify)
# With backend + MySQL running and Playwright Chromium installed:
INTEGRATED=1 npm --prefix frontend run test:e2e
```

See [update verification](docs/verification-update.md) and the [original verification record](docs/verification.md) for executed results and limitations, [release checklist](docs/release-status.md) for milestone evidence, and [setup](docs/setup.md) for test prerequisites. GitHub Actions runs the same relevant checks, including actual MySQL and actual browser Wasm execution. No performance superiority or educational benefit is claimed without measurement.

## Documentation

- [Database ER diagram, dictionary and persistence rules](docs/database.md)
- [SQL coursework: joins, aggregation, report view, indexes and transactions](docs/sql-examples.sql)
- [REST API, authentication and errors](docs/api.md)
- [Lesson structure, multilingual examples and concept validation](docs/lessons.md)
- [Adding a module](docs/adding-a-module.md)
- [Future undergraduate curriculum](docs/roadmap.md)
- [Research proposal: prediction versus passive animation](docs/research-note.md)

Release boundaries: no arbitrary user C compilation, email verification/password recovery, high-stakes private exam bank, distributed sessions, or deployment automation. Production use needs HTTPS, secure cookies, appropriate ingress rate limits, backups and secret provisioning. The included container configuration is for local development and review; nothing is deployed or merged by setup.
