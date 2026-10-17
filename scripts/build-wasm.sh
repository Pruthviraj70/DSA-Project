#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p frontend/public/engine .build/wasm
args=(-std=c17 -O2 -Iengine/include engine/src/engine.c --no-entry -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker,node -sFILESYSTEM=0 -sALLOW_MEMORY_GROWTH=0 -sINITIAL_MEMORY=16777216 '-sEXPORTED_FUNCTIONS=["_engine_config","_engine_value","_engine_edge","_engine_graph_weight","_engine_start","_engine_error","_engine_next","_engine_state","_engine_free"]' '-sEXPORTED_RUNTIME_METHODS=["ccall","UTF8ToString"]' -o .build/wasm/engine.js)
if command -v emcc >/dev/null; then emcc "${args[@]}"; else
 docker run --rm --user "$(id -u):$(id -g)" -e EM_CACHE=/tmp/emscripten-cache -v "$PWD:/src" -w /src emscripten/emsdk:4.0.18 emcc "${args[@]}"
fi

# Publish generated source and engine only after compilation succeeds.
python3 scripts/extract-source.py .build/wasm/source.json
cp .build/wasm/engine.js .build/wasm/engine.wasm .build/wasm/source.json frontend/public/engine/
chmod 644 frontend/public/engine/engine.js frontend/public/engine/engine.wasm frontend/public/engine/source.json
