#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p .build
cc=${CC:-gcc}
"$cc" -std=c17 -Wall -Wextra -Werror -Wno-misleading-indentation -g ${SANITIZERS--fsanitize=address,undefined} -Iengine/include engine/tests/test_engine.c -o .build/test-engine
.build/test-engine
