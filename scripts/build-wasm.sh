#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p frontend/public/engine .build/wasm
args=(-std=c17 -O2 -Iengine/include engine/src/engine.c --no-entry -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sFILESYSTEM=0 -sALLOW_MEMORY_GROWTH=0 -sINITIAL_MEMORY=16777216 '-sEXPORTED_FUNCTIONS=["_engine_config","_engine_value","_engine_edge","_engine_graph_weight","_engine_start","_engine_error","_engine_next","_engine_state","_engine_free"]' '-sEXPORTED_RUNTIME_METHODS=["ccall","UTF8ToString"]' )
compile() {
if command -v emcc >/dev/null; then emcc "${args[@]}" "$@"; else
 docker run --rm --user "$(id -u):$(id -g)" -e EM_CACHE=/tmp/emscripten-cache -v "$PWD:/src" -w /src emscripten/emsdk:4.0.18 emcc "${args[@]}" "$@"
fi
}
compile -DDSA_LEGACY -o .build/wasm/engine.js
compile -o .build/wasm/next.js

# Keep source-location diagnostics in the build directory; publish only runtime assets.
python3 scripts/extract-source.py .build/wasm/source.json
cp .build/wasm/{engine,next}.{js,wasm} frontend/public/engine/
chmod 644 frontend/public/engine/*.{js,wasm}
rm -f frontend/public/engine/source.json
