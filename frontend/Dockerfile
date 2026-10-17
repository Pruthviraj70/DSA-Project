FROM emscripten/emsdk:4.0.18 AS engine
WORKDIR /src
COPY engine engine
COPY scripts scripts
RUN bash scripts/build-wasm.sh
FROM node:24.19.0-bookworm-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN --mount=type=secret,id=network_ca if [ -f /run/secrets/network_ca ]; then export NODE_EXTRA_CA_CERTS=/run/secrets/network_ca; fi; npm ci
COPY frontend ./
COPY content /app/content
COPY --from=engine /src/frontend/public/engine public/engine
RUN npm run build
FROM nginx:1.28.0-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
