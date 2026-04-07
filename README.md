# Inbox Concierge

Inbox-style Gmail assistant with LLM-powered auto-labeling.

## Prerequisites

- [Bun](https://bun.sh/) (v1.3.10+)
- [Docker](https://www.docker.com/) (for PostgreSQL via [`compose.yaml`](compose.yaml))

## Getting Started

### 1. Install dependencies

```sh
bun install
```

### 2. Set up environment variables

Copy the example files and fill in any missing values (see comments in each file for OAuth, encryption, and API keys):

```sh
cp packages/backend/.env.example packages/backend/.env
cp packages/web/.env.example packages/web/.env
```

### 3. Start infrastructure

```sh
docker compose up -d
```

This starts:

| Service       | URL              | Credentials                                 |
| ------------- | ---------------- | ------------------------------------------- |
| PostgreSQL 18 | `localhost:5432` | `dev` / `dev` (database: `inbox-concierge`) |

To stop:

```sh
docker compose down
```

To stop and delete all data:

```sh
docker compose down -v
```

### 4. Run database migrations

With Postgres running and `DATABASE_URL` set in `packages/backend/.env` (matching the example), apply migrations:

```sh
bun run backend:db:migrate
```

Run this again after pulling changes that add new migration files.

### 5. Start the apps

**Backend** (Effect HTTP API on port 3000 by default):

```sh
bun run backend:start
```

**Web** (Vite dev server on port 3001):

```sh
bun run web:dev
```

## Project Structure

| Path                         | Description                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `packages/backend/`          | Effect HTTP API (Bun, PostgreSQL, migrations in `migrations/`)                    |
| `packages/web/`              | React app (Vite, Chakra UI, TanStack Router/Query/Form/DB)                        |
| `packages/http/`             | OpenAPI spec + generated TypeScript types                                         |
| `packages/tooling/tsconfig/` | Shared TypeScript configuration                                                   |
| `specs/`                     | Architecture and implementation guides (`guides/`, `architecture/`, `reference/`) |

## Useful Commands

| Command                      | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `bun run quality:check`      | Run all validations (typecheck + lint + format)           |
| `bun run quality:fix`        | Auto-fix lint and format issues                           |
| `bun run test`               | Run all tests                                             |
| `bun run api:sync`           | Regenerate OpenAPI spec + TypeScript types                |
| `bun run http:openapi:types` | Regenerate HTTP client types only (from existing OpenAPI) |
| `bun run backend:db:migrate` | Apply database migrations (local or any `DATABASE_URL`)   |
| `bun run backend:dev`        | Start backend in watch mode                               |
| `bun run backend:start`      | Start backend (no watch)                                  |
| `bun run web:dev`            | Start web dev server                                      |
| `bun run web:build`          | Production build for the web app                          |
| `bun run web:component:add`  | Add a Chakra UI snippet component                         |
