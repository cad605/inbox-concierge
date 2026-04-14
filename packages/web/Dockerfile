# syntax = docker/dockerfile:1
# Build from repository root: fly deploy --dockerfile packages/web/Dockerfile
# Pass API URL at build time: --build-arg VITE_API_URL=https://<backend>.fly.dev

ARG BUN_VERSION=1.3.11
FROM oven/bun:${BUN_VERSION}-slim AS base

WORKDIR /app

FROM base AS build

RUN apt-get update -qq && \
	apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3 && \
	rm -rf /var/lib/apt/lists/*

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package.json bun.lock bunfig.toml ./
COPY packages ./packages

RUN bun install --ci --filter @workspace/web

ENV NODE_ENV=production
WORKDIR /app/packages/web
RUN bun run build

FROM nginx:1.29-alpine

COPY --from=build /app/packages/web/dist /usr/share/nginx/html
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
	CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
