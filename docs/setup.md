# Local development: Windows, macOS, Linux

The application is a browser client plus Java service and MySQL. Supported development baseline: Node 24.19.0, JDK 21 LTS **including javac**, Docker Engine/Desktop with Compose v2, Python 3, and Git. GCC/Clang with C17 is needed only for native tests; Emscripten 4.0.18 is provided by a container or installed SDK. Maven 3.9.11 is downloaded and checksum-verified by the committed Maven wrapper 3.3.4. Do not install a separate Maven to work around wrapper failures. Frontend dependencies are exact versions with an npm integrity lockfile; use `npm ci`.

## All-container path (all operating systems)

1. Install Docker Desktop (Windows/macOS) or Docker Engine + Compose plugin (Linux). On Windows, enable the WSL2 Linux-container backend. The containers require several GB of disk; vfs storage drivers use substantially more space than overlay storage.
2. Clone the repository; use the existing checkout in a cloud task, without creating another worktree.
3. Copy `.env.example` to `.env` and replace the two database password placeholders with different local passwords. The file is ignored. No account or database password is needed in the browser.
4. From the repository root, run `docker compose up --build -d`. Browse port 8088 on your local machine. Nginx serves the frontend and proxies `/api` to Spring Boot; MySQL is health-gated and Flyway migrates/seeds it before the backend starts serving.
5. Verify readiness with `curl --fail http://127.0.0.1:8088/api/modules` (PowerShell: `Invoke-RestMethod http://127.0.0.1:8088/api/modules`). Expect total 14. Open the Arrays module and step to observe C state changes; sign up for account persistence.
6. Logs: `docker compose logs backend` or `docker compose logs frontend`. Stop processes with `docker compose down`. Named-volume data persists. Removing the volume is destructive; do so only deliberately for a disposable database.

The full container build compiles the actual C source in the Emscripten stage, installs frontend dependencies, type-checks/builds Vite, packages Java using the wrapper, and runs only the JRE/Nginx runtime images. Tests run separately, because MySQL integration tests require a Docker daemon. Java and Node are not required on the host for this path.

## Host development (Linux/macOS or Windows with Git Bash/WSL)

```sh
cp .env.example .env
# Edit .env with local database passwords, then:
docker compose up -d db
npm --prefix frontend ci
scripts/build-wasm.sh
```

`build-wasm.sh` uses an activated `emcc` when available, otherwise `emscripten/emsdk:4.0.18` through Docker. The container runs as the invoking user and uses a temporary writable Emscripten cache. It writes only generated engine/source files under ignored `frontend/public/engine/`. Rebuild after changing any C file, then refresh the browser. Vite does not compile C itself.

Set `JAVA_HOME` to the JDK 21 directory and put its `bin` on PATH. Check **both** `java -version` and `javac -version`. Export the backend settings from `backend/.env.example`, using the same password as `.env`; Spring does not automatically load dotenv files.

```sh
export DB_URL='jdbc:mysql://127.0.0.1:3306/dsalab'
export DB_USER=dsalab
# Set DB_PASSWORD securely in your shell/environment; do not commit it.
cd backend
./mvnw spring-boot:run
# In a second terminal at repository root:
npm --prefix frontend run dev
```

Use Vite's local port 5173. Backend is 8080; MySQL binds loopback 3306. The frontend calls only same-origin `/api` and the Vite proxy forwards it. No frontend API key or DB variable is needed. Check in `.env.example` placeholders only. For a production HTTPS origin, set `COOKIE_SECURE=true`; this must remain false for plain HTTP local development.

On macOS, install an ARM64 JDK/Node on Apple Silicon and let Docker select compatible image platforms. On Linux, use distribution C build tools and a current Docker daemon; running the backend never requires root. Native C tests support `CC=clang` or `CC=gcc`.

### Windows PowerShell equivalents

```powershell
Copy-Item .env.example .env
# Edit .env, then:
docker compose up -d db
npm --prefix frontend ci
docker run --rm -v "${PWD}:/src" -w /src emscripten/emsdk:4.0.18 bash scripts/build-wasm.sh
$env:JAVA_HOME = 'C:\path\to\jdk-21'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
$env:DB_URL = 'jdbc:mysql://127.0.0.1:3306/dsalab'
$env:DB_USER = 'dsalab'
# Set $env:DB_PASSWORD securely to match .env.
Set-Location backend
.\mvnw.cmd spring-boot:run
# In another terminal from repository root:
npm --prefix frontend run dev
```

Use WSL2 or Git Bash + MSYS2 GCC for the shell/native test scripts. Sanitizers are required in Linux CI; if a local compiler lacks them, use `SANITIZERS='' scripts/test-native.sh` and clearly record that sanitizer coverage was not run locally. The all-container path avoids Windows compiler path differences. Current release validation was performed on Linux/Chromium; native Windows/macOS host executions have not been tested on those machines.

## Standalone Emscripten (optional)

The containerized option above is the default reproducible compiler. To install the SDK directly:

```sh
git clone https://github.com/emscripten-core/emsdk.git .tools/emsdk
cd .tools/emsdk
./emsdk install 4.0.18
./emsdk activate 4.0.18
. ./emsdk_env.sh
cd ../..
scripts/build-wasm.sh
```

On Windows Command Prompt, the corresponding SDK commands are `emsdk.bat install 4.0.18`, `emsdk.bat activate 4.0.18`, and `emsdk_env.bat`. Use the container/WSL build script, or the same emcc arguments recorded in `scripts/build-wasm.sh`. Do not use `latest` when reproducing this release. TLS, package signatures and checksums must remain enabled. SDK guidance: https://github.com/emscripten-core/emsdk and https://emscripten.org/docs/getting_started/downloads.html .

## Checks

```sh
scripts/test-native.sh                         # actual C17 + ASan/UBSan
python3 scripts/generate-engine-fixtures.py    # native protocol/replay oracle
scripts/build-wasm.sh
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
cd backend && ./mvnw verify && cd ..           # Testcontainers starts actual MySQL
cd frontend && npx playwright install --with-deps chromium && cd ..
INTEGRATED=1 npm --prefix frontend run test:e2e # backend + dev MySQL must be running
```

Default browser runs skip only the explicitly gated authenticated integration flow when `INTEGRATED` is unset. Release acceptance uses `INTEGRATED=1`, with no skips. If the Playwright browser CDN is blocked but a compatible Chromium is already installed, set `CHROMIUM_PATH=/path/to/chromium`. The tests load actual Wasm and compare every event for 34 operations to native traces, check bounds/cancellation/reset, and exercise the UI. No mock JS engine substitutes for C.

`BASE_URL=http://127.0.0.1:8088 INTEGRATED=1 npm --prefix frontend run test:e2e -- e2e/learning.spec.ts e2e/slice.spec.ts e2e/authenticated.spec.ts` exercises the production Nginx/Compose bundle. The two engine harness tests run against Vite because they import the development client class; the production UI tests still execute actual Wasm workers.

## Restricted cloud/proxy networks

Required destinations include GitHub (checkout/SDK), npm registry, Maven Central, Docker registry/CDNs and Playwright browser/CDN endpoints. Reuse platform-injected Git HTTPS authentication. An unset GitHub token or `gh` API failure does not mean Git reads or pushes require a new token. Do not print environment/credential values.

For a read-only home directory, use writable task paths for `npm --cache`, `MAVEN_USER_HOME`, `-Dmaven.repo.local`, `DOCKER_CONFIG`, `BUILDX_CONFIG`, and `PLAYWRIGHT_BROWSERS_PATH`. Avoid changing HOME. Java/Maven may need an explicit trusted proxy because they do not automatically consume HTTPS_PROXY. Configure Maven's supported settings.xml `<proxies>` and JVM proxy host/port for the wrapper bootstrap. Preserve TLS verification and use the organization's trusted CA store.

`compose.build-proxy.yaml` optionally mounts local Maven settings, wrapper JVM options, a Java truststore and a PEM CA bundle as **BuildKit secrets**, and passes Docker's predefined proxy build arguments for npm. Set `MAVEN_SETTINGS_FILE`, `MAVEN_OPTS_FILE`, `JAVA_TRUSTSTORE_FILE`, `NETWORK_CA_FILE` to local paths, then build with `docker compose -f compose.yaml -f compose.build-proxy.yaml build`. The Maven options file can specify `-Dhttps.proxyHost=... -Dhttps.proxyPort=... -Djavax.net.ssl.trustStore=/run/secrets/java_truststore`. Never commit that file. If a platform proxy hostname exists only in the host's hosts file, provide the same trusted mapping using Compose `build.extra_hosts` in a local ignored override. Do not bypass the proxy or disable TLS to make a build pass.
