# syntax = docker/dockerfile:1
# Build from repository root: fly deploy --dockerfile packages/backend/Dockerfile

ARG BUN_VERSION=1.3.11
FROM oven/bun:${BUN_VERSION}-slim AS base

LABEL fly_launch_runtime="Bun"

WORKDIR /app
ENV NODE_ENV="production"

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential pkg-config python-is-python3 && \
    rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock bunfig.toml ./
COPY packages ./packages

RUN bun install --ci --filter @workspace/backend

FROM base

COPY --from=build /app /app

WORKDIR /app/packages/backend
EXPOSE 3000
CMD ["bun", "run", "start"]
