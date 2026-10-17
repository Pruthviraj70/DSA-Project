FROM emscripten/emsdk:4.0.18 AS engine
# Bind only compiler inputs, then build in one SDK layer. This avoids duplicating
# the multi-gigabyte SDK for both COPY and RUN on VFS-backed Docker hosts.
RUN --mount=type=bind,source=engine,target=/source/engine \
    --mount=type=bind,source=scripts,target=/source/scripts \
    mkdir -p /build && cp -R /source/engine /source/scripts /build/ && cd /build && bash scripts/build-wasm.sh
FROM node:24.19.0-bookworm-slim AS frontend
COPY . /app
COPY --from=engine /build/frontend/public/engine /app/frontend/public/engine
RUN --mount=type=cache,target=/root/.npm --mount=type=secret,id=network_ca if [ -f /run/secrets/network_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/network_ca; fi; cd /app/frontend && npm ci && npm run build
FROM nginx:1.28.0-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /app/frontend/dist /usr/share/nginx/html
RUN chmod -R a+rX /usr/share/nginx/html
EXPOSE 80
