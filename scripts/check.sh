#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/validate-content.py
python3 scripts/test-content.py
python3 scripts/test-examples.py
scripts/test-native.sh
python3 scripts/generate-engine-fixtures.py
scripts/build-wasm.sh
npm --prefix frontend ci
npm --prefix frontend test
npm --prefix frontend run build
python3 scripts/check-public-assets.py
(cd backend && ./mvnw -B verify)
curl --fail --silent http://127.0.0.1:8080/api/modules > /dev/null
INTEGRATED=1 npm --prefix frontend run test:e2e
