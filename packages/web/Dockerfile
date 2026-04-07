# syntax = docker/dockerfile:1
# Build from repository root: fly deploy --dockerfile packages/web/Dockerfile
# Pass API URL at build time: --build-arg VITE_API_URL=https://<backend>.fly.dev

ARG BUN_VERSION=1.3.11
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

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

ENV NODE_ENV="production"
WORKDIR /app/packages/web
RUN bun run build

FROM base

COPY --from=build /app /app

WORKDIR /app/packages/web
EXPOSE 3000
CMD ["bun", "run", "start"]
