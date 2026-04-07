# Reference Repositories

This project includes reference repositories cloned into `.repos/` by [`scripts/setup.sh`](../../scripts/setup.sh) for pattern discovery and API lookup. **Always prefer these over `node_modules/` for learning.**

Cloned today:

| Directory                 | Source repo             |
| ------------------------- | ----------------------- |
| `.repos/effect/`          | `effect-ts/effect-smol` |
| `.repos/chakra-ui/`       | `chakra-ui/chakra-ui`   |
| `.repos/tanstack-router/` | `TanStack/router`       |
| `.repos/tanstack-query/`  | `TanStack/query`        |
| `.repos/tanstack-form/`   | `TanStack/form`         |
| `.repos/tanstack-db/`     | `TanStack/db`           |

---

## This repository (`inbox-concierge`)

Monorepo managed with **bun** workspaces (`package.json`). Authoritative implementation rules live in [`AGENTS.md`](../../AGENTS.md) and under `specs/guides/`.

### Packages

| Package                         | Role                                                                                                                                                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`packages/backend`**          | Effect runtime on **Bun**: `HttpApi` HTTP server, PostgreSQL via `@effect/sql-pg`, OAuth/session/inbox domain. Entry: `src/entrypoints/http/main.ts`; background workers under `src/entrypoints/worker/`. |
| **`packages/web`**              | **Vite** SPA (not TanStack Start): TanStack Router, Query, Form, DB (Query Collection), Chakra UI, `openapi-fetch` typed by `@workspace/http`.                                                            |
| **`packages/http`**             | Generated **OpenAPI** types (`schema.d.ts`, `openapi.json`) and a thin **`openapi-fetch`** client; types are produced from the backend export (`bun api:sync`).                                           |
| **`packages/tooling/tsconfig`** | Shared TypeScript config (`@workspace/tsconfig`).                                                                                                                                                         |

### Backend layout (`packages/backend/src/`)

Flat modules (no barrel files). Typical folders:

| Area                  | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `domain/`             | Models, DTOs, domain errors (`Schema.TaggedErrorClass`), constants |
| `ports/`              | Narrow service interfaces                                          |
| `adapters/`           | Port implementations (DB, OAuth, queues, AI, etc.)                 |
| `use-cases/`          | Application workflows                                              |
| `entrypoints/http/`   | `HttpApi` groups, handlers, middleware, OpenAPI wiring             |
| `entrypoints/worker/` | Long-running workers (e.g. inbox sync, auto-label)                 |
| `infrastructure/`     | Shared infrastructure (e.g. DB client, logger)                     |
| `lib/`                | Small shared helpers                                               |

Specs: [`specs/guides/effect-guide.md`](../guides/effect-guide.md), [`specs/guides/api-guide.md`](../guides/api-guide.md).

### Web layout (`packages/web/src/`)

| Area              | Purpose                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `routes/`         | File-based TanStack Router routes (`_public`, `_authenticated`, etc.)                                       |
| `features/`       | Feature UI (inbox, settings, auth, shell)                                                                   |
| `infrastructure/` | API client, env, query client/keys, **TanStack DB collections** (`collections/*.ts`), hooks, Paraglide i18n |
| `ui/`             | Shared Chakra-oriented UI helpers and snippets                                                              |

TanStack DB **Query Collection** schemas use **Effect `Schema`** and **`Schema.toStandardSchemaV1`** only in `infrastructure/collections/*.ts`. Forms use TanStack Form with **Effect Schema** standard schemas (see e.g. `features/settings/add-label-dialog-schema.ts`), not a separate Zod layer.

Specs: [`specs/guides/frontend-guide.md`](../guides/frontend-guide.md).

### How `.repos/` maps to this codebase

| Reference repo      | Use in this project                                                                                        |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **effect**          | `LLMS.md` and `effect/unstable/*` align with backend Effect 4 beta, `HttpApi`, SQL, `@effect/platform-bun` |
| **chakra-ui**       | `@chakra-ui/react` UI; MCP `user-chakra-ui` for component lookup                                           |
| **tanstack-router** | File routes, loaders, search params, auth guards — **Vite + `@tanstack/router-plugin`**, not `react-start` |
| **tanstack-query**  | `queryOptions`, `ensureQueryData`, `useSuspenseQuery`                                                      |
| **tanstack-form**   | `createFormHook` + standard-schema validation (Effect Schema)                                              |
| **tanstack-db**     | `queryCollectionOptions`, `preload`, `useLiveQuery`                                                        |

---

## Effect (`.repos/effect/`)

**Source:** `effect-ts/effect-smol` — Effect V4.
**Authoritative guide:** `.repos/effect/LLMS.md` — read this before looking anywhere else for Effect V4 patterns.

Additional docs at the root: `MIGRATION.md` (V3 → V4 overview linking into `migration/*.md`), `AGENTS.md` (contributor conventions), and `.patterns/` (testing, platform, modules, errors, JSDoc).

### Core Package (`.repos/effect/packages/effect/src/`)

The main `effect` package. In V4 many former standalone packages (platform abstractions, SQL core, HTTP, RPC, etc.) are consolidated here.

**Stable modules** (flat `.ts` files re-exported from `index.ts`):

| Module             | Use For                                     |
| ------------------ | ------------------------------------------- |
| **Effect**         | Core effect type, `Effect.gen`, `Effect.fn` |
| **Schema**         | Validation, encoding/decoding               |
| **Layer**          | Service composition                         |
| **ServiceMap**     | `ServiceMap.Service` class pattern          |
| **Data**           | Value objects, tagged unions                |
| **Brand**          | Branded types (AccountId, etc.)             |
| **Either**         | Error handling                              |
| **Option**         | Optional values                             |
| **Match**          | Pattern matching                            |
| **BigDecimal**     | Monetary calculations                       |
| **DateTime**       | Date/time handling                          |
| **Duration**       | Time durations                              |
| **Config**         | Configuration                               |
| **Stream**         | Streaming data                              |
| **PubSub**         | Publish/subscribe                           |
| **Queue**          | Async queues                                |
| **Ref**            | Mutable references                          |
| **Scope**          | Resource management                         |
| **Fiber**          | Concurrent execution                        |
| **ManagedRuntime** | Long-lived runtime                          |
| **Array**          | Array utilities                             |
| **Record**         | Record utilities                            |
| **Struct**         | Object operations                           |
| **Schedule**       | Retry/repeat schedules                      |
| **Resource**       | Declarative resources                       |
| **Pool**           | Resource pooling                            |

**`unstable/` modules** (imported as `effect/unstable/<area>`):

| Area              | Key Files                                                                                                              |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **sql**           | `SqlClient`, `SqlConnection`, `SqlError`, `SqlModel`, `SqlResolver`, `SqlSchema`, `SqlStream`, `Statement`, `Migrator` |
| **http**          | HTTP client/server, router, cookies, multipart, fetch client                                                           |
| **httpapi**       | `HttpApi` declarative API definitions                                                                                  |
| **rpc**           | RPC framework                                                                                                          |
| **ai**            | `LanguageModel` abstraction                                                                                            |
| **cli**           | CLI framework                                                                                                          |
| **process**       | Process management                                                                                                     |
| **cluster**       | Distributed systems                                                                                                    |
| **workflow**      | Workflow engine                                                                                                        |
| **observability** | Otlp tracing/metrics                                                                                                   |
| **persistence**   | Key-value persistence                                                                                                  |
| **socket**        | WebSocket support                                                                                                      |
| **workers**       | Worker thread management                                                                                               |
| **reactivity**    | Reactive primitives                                                                                                    |
| **schema**        | VariantSchema, Model extensions                                                                                        |

**`testing/` modules:** `FastCheck`, `TestClock`, `TestConsole`, `TestSchema`.

**Package-level docs:** `SCHEMA.md`, `HTTPAPI.md`, `CONFIG.md`, `OPTIC.md`, `MCP.md`.

### SQL Postgres (`.repos/effect/packages/sql/pg/`)

`@effect/sql-pg` — the PostgreSQL driver. Core SQL abstractions live in `effect/unstable/sql`.

| File            | Purpose           |
| --------------- | ----------------- |
| `PgClient.ts`   | PostgreSQL client |
| `PgMigrator.ts` | Migration runner  |

### Platform Node (`.repos/effect/packages/platform-node/`)

`@effect/platform-node` — Node.js runtime implementations. Abstract platform types (FileSystem, Path, PlatformError) live in the core `effect` package.

Key modules: `NodeRuntime`, `NodeHttpPlatform`, `NodeHttpServer`, `NodeHttpClient`, `NodeFileSystem`, `NodePath`, `NodeStream`, `NodeStdio`, `NodeTerminal`, `NodeSocket`, `NodeWorker`, `NodeRedis`, `NodeServices`.

**This repo** uses **`@effect/platform-bun`** (Bun) rather than `platform-node`; concepts overlap—see backend `http.config.ts` and layers.

### Vitest (`.repos/effect/packages/vitest/`)

`@effect/vitest` — testing utilities. Provides `it.effect`, `layer`, `prop` (property tests).

### Other Platform Packages

| Package                  | Path                                           | Description        |
| ------------------------ | ---------------------------------------------- | ------------------ |
| **platform-bun**         | `.repos/effect/packages/platform-bun/`         | Bun runtime        |
| **platform-browser**     | `.repos/effect/packages/platform-browser/`     | Browser runtime    |
| **platform-node-shared** | `.repos/effect/packages/platform-node-shared/` | Shared Node pieces |

### Other Packages

| Package           | Path                                    | Description                                    |
| ----------------- | --------------------------------------- | ---------------------------------------------- |
| **opentelemetry** | `.repos/effect/packages/opentelemetry/` | OpenTelemetry integration                      |
| **ai/\***         | `.repos/effect/packages/ai/*/`          | AI provider packages (anthropic, openai, etc.) |
| **atom/\***       | `.repos/effect/packages/atom/*/`        | Reactive atom bindings (react, solid, vue)     |

### V3 → V4 Migration

Detailed migration guides live in `.repos/effect/migration/`:

| File            | Topic                       |
| --------------- | --------------------------- |
| `schema.md`     | Schema API changes          |
| `services.md`   | Service/Tag pattern changes |
| `cause.md`      | Cause/error changes         |
| `layer.md`      | Layer memoization changes   |
| `runtime.md`    | Runtime changes             |
| `generators.md` | Generator pattern changes   |

---

## Chakra UI (`.repos/chakra-ui/`)

**Source:** `chakra-ui/chakra-ui` — the Chakra UI component library (v3+). Also available via the `user-chakra-ui` MCP server.

### Main Library (`.repos/chakra-ui/packages/react/src/`)

The `@chakra-ui/react` package with components, theme recipes/tokens, and styled-system.

### Sandbox Examples (`.repos/chakra-ui/sandbox/`)

Integration demos for various frameworks:

| Example            | Framework            |
| ------------------ | -------------------- |
| `vite-ts/`         | Vite + TypeScript    |
| `next-app/`        | Next.js App Router   |
| `next-pages/`      | Next.js Pages Router |
| `remix-ts/`        | Remix                |
| `react-router/`    | React Router         |
| `tanstack-router/` | TanStack Router      |
| `storybook-ts/`    | Storybook            |

### Documentation Site (`.repos/chakra-ui/apps/www/`)

The chakra-ui.com docs source. Component APIs are generated as JSON in `public/r/`.

---

## TanStack Router (`.repos/tanstack-router/`)

**Source:** `TanStack/router` — file-based routing and TanStack Start framework.

**This project** uses the **React Router** packages with **Vite** (`@tanstack/router-plugin`). TanStack Start (`react-start`) is present upstream for SSR apps; this repo’s web app is a client-rendered Vite SPA—use Router + Query skills, not Start-only patterns, unless you intentionally adopt Start.

### Key Packages

| Package               | Path                                                 | Description       |
| --------------------- | ---------------------------------------------------- | ----------------- |
| **react-start**       | `.repos/tanstack-router/packages/react-start/`       | Start framework   |
| **react-router**      | `.repos/tanstack-router/packages/react-router/`      | Router for React  |
| **router-core**       | `.repos/tanstack-router/packages/router-core/`       | Core router logic |
| **start-server-core** | `.repos/tanstack-router/packages/start-server-core/` | Server-side core  |
| **start-client-core** | `.repos/tanstack-router/packages/start-client-core/` | Client-side core  |

### Skills

**Router Core** (`.repos/tanstack-router/packages/router-core/skills/router-core/`):

- `SKILL.md` — entry skill with sub-skill index
- `search-params/SKILL.md` — search param patterns
- `path-params/SKILL.md` — path param patterns
- `navigation/SKILL.md` — navigation patterns
- `data-loading/SKILL.md` — loader patterns
- `auth-and-guards/SKILL.md` — auth guards
- `code-splitting/SKILL.md` — code splitting
- `not-found-and-errors/SKILL.md` — error handling
- `type-safety/SKILL.md` — type safety
- `ssr/SKILL.md` — server-side rendering

**React Router** (`.repos/tanstack-router/packages/react-router/skills/`):

- `react-router/SKILL.md` — React bindings, hooks, components
- `compositions/router-query/SKILL.md` — Router + Query integration

**React Start** (`.repos/tanstack-router/packages/react-start/skills/`):

- `react-start/SKILL.md` — TanStack Start (SSR framework)

### Examples (`.repos/tanstack-router/examples/react/`)

Many example apps. For patterns closest to this repo (file-based routing + React Query, no Start), favor examples such as `basic-react-query-file-based/` and `kitchen-sink-react-query-file-based/`. Start-specific examples (`start-basic/`, etc.) apply if you migrate to TanStack Start.

---

## TanStack Query (`.repos/tanstack-query/`)

**Source:** `TanStack/query` — server state management. No `SKILL.md` files — learning is via docs and examples.

### Key Packages

| Package                  | Path                                                   | Description    |
| ------------------------ | ------------------------------------------------------ | -------------- |
| **query-core**           | `.repos/tanstack-query/packages/query-core/`           | Core logic     |
| **react-query**          | `.repos/tanstack-query/packages/react-query/`          | React bindings |
| **react-query-devtools** | `.repos/tanstack-query/packages/react-query-devtools/` | Devtools       |

### Examples (`.repos/tanstack-query/examples/react/`)

27 example apps. Relevant ones:

| Example                      | Pattern                    |
| ---------------------------- | -------------------------- |
| `basic/`                     | Basic query usage          |
| `simple/`                    | Minimal example            |
| `suspense/`                  | Suspense integration       |
| `prefetching/`               | Data prefetching           |
| `pagination/`                | Paginated queries          |
| `load-more-infinite-scroll/` | Infinite scroll            |
| `optimistic-updates-cache/`  | Optimistic updates (cache) |
| `optimistic-updates-ui/`     | Optimistic updates (UI)    |
| `offline/`                   | Offline support            |

### Docs (`.repos/tanstack-query/docs/`)

Framework-specific reference under `docs/framework/react/` and core reference under `docs/reference/`.

---

## TanStack Form (`.repos/tanstack-form/`)

**Source:** `TanStack/form` — form state management. No `SKILL.md` files — learning is via docs and examples.

### Key Packages

| Package              | Path                                              | Description                |
| -------------------- | ------------------------------------------------- | -------------------------- |
| **form-core**        | `.repos/tanstack-form/packages/form-core/`        | Shared core                |
| **react-form**       | `.repos/tanstack-form/packages/react-form/`       | React bindings             |
| **react-form-start** | `.repos/tanstack-form/packages/react-form-start/` | TanStack Start integration |

### Guides (`.repos/tanstack-form/docs/framework/react/guides/`)

| Guide                     | Topic                   |
| ------------------------- | ----------------------- |
| `basic-concepts.md`       | Core concepts           |
| `validation.md`           | Validation patterns     |
| `form-composition.md`     | Composing forms         |
| `arrays.md`               | Array field patterns    |
| `listeners.md`            | Field listeners         |
| `submission-handling.md`  | Form submission         |
| `linked-fields.md`        | Linked/dependent fields |
| `async-initial-values.md` | Async initial values    |
| `ssr.md`                  | Server-side rendering   |
| `ui-libraries.md`         | UI library integration  |
| `custom-errors.md`        | Custom error display    |
| `dynamic-validation.md`   | Dynamic validation      |
| `reactivity.md`           | Reactivity model        |
| `debugging.md`            | Debugging forms         |
| `devtools.md`             | Devtools usage          |

### Quick Start

`.repos/tanstack-form/docs/framework/react/quick-start.md` — demonstrates the `createFormHook` / `createFormHookContexts` pattern.

### Examples (`.repos/tanstack-form/examples/react/`)

Includes `simple`, `large-form`, `array`, `dynamic`, `query-integration`, `tanstack-start`, `ui-libraries`, `standard-schema`, etc. **`standard-schema`** is especially relevant here: this repo validates forms with **Effect Schema** via `Schema.toStandardSchemaV1`.

---

## TanStack DB (`.repos/tanstack-db/`)

**Source:** `TanStack/db` — reactive client-side database with sync adapters.

### Key Packages

| Package                 | Path                                               | Description            |
| ----------------------- | -------------------------------------------------- | ---------------------- |
| **db**                  | `.repos/tanstack-db/packages/db/`                  | Core library           |
| **react-db**            | `.repos/tanstack-db/packages/react-db/`            | React bindings         |
| **query-db-collection** | `.repos/tanstack-db/packages/query-db-collection/` | TanStack Query adapter |

### Skills

**DB Core** (`.repos/tanstack-db/packages/db/skills/db-core/`):

- `SKILL.md` — core concepts and sub-skill index
- `collection-setup/SKILL.md` — collection creation and adapters
- `live-queries/SKILL.md` — live query patterns
- `mutations-optimistic/SKILL.md` — mutation and optimistic update patterns
- `custom-adapter/SKILL.md` — building custom adapters
- `persistence/SKILL.md` — persistence patterns

**Meta-framework** (`.repos/tanstack-db/packages/db/skills/meta-framework/`):

- `SKILL.md` — preloading in route loaders

**React DB** (`.repos/tanstack-db/packages/react-db/skills/react-db/`):

- `SKILL.md` — React hooks (`useLiveQuery`, `useLiveSuspenseQuery`)

### Examples (`.repos/tanstack-db/examples/react/`)

Includes `todo`, `projects`, `paced-mutations-demo`, `offline-transactions`.

---

## Quick Reference

| Repo / area         | Best For                                  | Key entry point                                                      |
| ------------------- | ----------------------------------------- | -------------------------------------------------------------------- |
| **This monorepo**   | Implemented patterns, package boundaries  | `packages/backend/src/`, `packages/web/src/`, `specs/guides/`        |
| **effect**          | Effect V4 APIs, HttpApi, SQL, platform    | `.repos/effect/LLMS.md`                                              |
| **chakra-ui**       | Component APIs, theming, recipes          | `.repos/chakra-ui/packages/react/src/`, `sandbox/`                   |
| **tanstack-router** | Routing, loaders, Query composition       | `router-core` + `react-router` skills; Vite file routes in this repo |
| **tanstack-query**  | Server state, caching, prefetching        | `examples/react/`                                                    |
| **tanstack-form**   | Form state, standard-schema validation    | `docs/framework/react/guides/`, `examples/react/standard-schema`     |
| **tanstack-db**     | Reactive client collections, live queries | DB core + React DB skills                                            |
