# Effect Guide (V4)

This guide describes how we use **Effect V4** in **Inbox Concierge** (`packages/backend`, and HTTP entrypoints that compose the same layers). It covers coding patterns, Schema, errors, `ServiceMap` services, Layers, SQL, and testing.

Authoritative library notes live in [`.repos/effect/LLMS.md`](../../.repos/effect/LLMS.md) in this repo—prefer that and Effect source under `.repos/effect/` over generic web docs.

---

## Table of Contents

1. [Project layout](#project-layout)
2. [Critical rules](#critical-rules)
3. [Schema patterns](#schema-patterns)
4. [Error handling](#error-handling)
5. [Service pattern (`ServiceMap.Service` + `Layer`)](#service-pattern-servicemapservice--layer)
6. [Layer memoization and composition](#layer-memoization-and-composition)
7. [SQL patterns (`effect/unstable/sql`)](#sql-patterns-effectunstablesql)
8. [Use cases and `AuthUserId`](#use-cases-and-authuserid)
9. [HTTP middleware context (`CurrentUser`, `CurrentSession`)](#http-middleware-context-currentuser-currentsession)
10. [Testing](#testing-effect-heavy-code)

---

## Project layout

| Area      | Path                                     | Role                                                         |
| --------- | ---------------------------------------- | ------------------------------------------------------------ |
| Domain    | `packages/backend/src/domain/`           | Models (`Schema.Class` / `Model.Class`), DTOs, tagged errors |
| Ports     | `packages/backend/src/ports/`            | `ServiceMap.Service` interfaces only (no implementation)     |
| Adapters  | `packages/backend/src/adapters/`         | SQL, Google APIs, queues—`Layer.effect` implementations      |
| Use cases | `packages/backend/src/use-cases/`        | Orchestration: `Effect.fn`, yield ports, stay HTTP-agnostic  |
| HTTP      | `packages/backend/src/entrypoints/http/` | `HttpApi` groups, handlers, middleware                       |

**Conventions:**

- **Flat modules**—prefer `create-label.use-case.ts` over deep barrel folders (see `AGENTS.md`).
- **Service ids** include a stable prefix, e.g. `"app/ports/ThreadRepository"`, `"app/HttpApi/Authorization/CurrentUser"`.
- **Compose adapters** with `Layer.mergeAll(...)` (see `adapters/layers.ts`).

---

## Critical rules

### 1. Avoid `any` and unnecessary type assertions

```typescript
// WRONG
const result: any = someValue;
const id = value as ThreadId;

// CORRECT — branded types
const id = ThreadId.makeUnsafe(rawId);

// CORRECT — decode unknown data
const thread = yield * Schema.decodeUnknownEffect(Thread)(data);
```

Prefer `Schema.makeUnsafe()` for known-good construction, `Schema.decodeUnknownEffect` at boundaries, and `identity` from `effect/Function` when you need a compile-time check without asserting.

### 2. Do not use `catch` when the error type is `never`

If an effect cannot fail, do not attach error handlers—use it directly.

### 3. Do not put untyped `Error` in the error channel

Use `Schema.TaggedErrorClass` (and `{ httpApiStatus }` when the error maps to HTTP—see `UnauthorizedError`, `AutoLabelError`, etc.).

### 4. Do not use `{ disableValidation: true }` with `makeUnsafe`

Validation should stay on; fix the data or the schema.

### 5. Prefer `Effect.fn` for functions that return effects

**Avoid exporting raw `Effect.gen` wrappers**—use `Effect.fn("name")` so stack traces and spans stay consistent.

```typescript
// WRONG
const findThread = (id: ThreadId) =>
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    return yield* sql`SELECT * FROM threads WHERE id = ${id}`;
  });

// CORRECT
const findThread = Effect.fn("findThread")(function* (id: ThreadId) {
  const sql = yield* SqlClient.SqlClient;
  return yield* sql`SELECT * FROM threads WHERE id = ${id}`;
});
```

Use `Effect.fn.Return<Success, Error>` when you need an explicit return type. Pass extra combinators as additional arguments to `Effect.fn`—**do not** tack a `.pipe` onto the `Effect.fn` call for those.

Always **`return yield*`** when failing so TypeScript knows control flow stops.

### 6. Do not wrap pure code in `Effect.try`

Use `Effect.try` only for operations that actually throw (e.g. `JSON.parse`). Plain `map`/`filter` stay synchronous.

### 7. Prefer `mapError` over `catchAllCause` for expected failures

`catchAllCause` merges **defects** (bugs) with **errors** (expected). Map or narrow expected errors instead of squashing every cause into one domain error—otherwise real bugs get hidden.

### 8. Do not silently discard failures

If something can fail, that failure should remain visible (propagate, map to another tagged error, or recover with an explicit success value). Avoid `Effect.ignore` and empty catch handlers for side effects that matter.

---

## Pipe composition

Chain `.pipe()` for multi-step flows. Oxlint may enforce arity limits on long pipelines—split when needed.

---

## Schema patterns

### Prefer `Schema.Class` for domain-only types

`Schema.Class` gives constructors, `Equal`, and `Hash` without boilerplate.

### Use `Model.Class` for database-backed tables

`Model.Class` (from `effect/unstable/schema`) defines insert/update/select variants in one place. Examples in this repo: `Thread`, `Label`.

```typescript
import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

export class Label extends Model.Class<Label>("Label")({
  id: Model.GeneratedByApp(LabelId),
  userId: AuthUserId,
  name: Schema.Trimmed.check(Schema.isNonEmpty()),
  prompt: Model.FieldOption(Schema.String),
  type: LabelType,
  isActive: Schema.Boolean,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
}) {}
```

**In adapters**, use the model as `SqlSchema` `Result` when a query returns full table rows. For **joins, projections, or aggregates**, define a small `Schema.Struct` for that row shape (see `InboxThreadPageRow` and related structs in `thread-repository.adapter.ts`)—do not force a join result into a single `Model.Class` if the columns do not match.

### Branded IDs

```typescript
export const ThreadId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("ThreadId"));
export type ThreadId = typeof ThreadId.Type;
```

### `Schema.TaggedErrorClass` for domain errors

```typescript
export class ThreadNotFound extends Schema.TaggedErrorClass<ThreadNotFound>()("ThreadNotFound", {
  threadId: ThreadId,
}) {}

export class InboxPersistenceError extends Schema.TaggedErrorClass<InboxPersistenceError>()(
  "InboxPersistenceError",
  { cause: Schema.Defect },
) {}
```

Add `{ httpApiStatus: … }` to the class options when the HTTP layer should map the error to a status code.

### Errors with a `reason` field

Use a tagged `reason` union when one error wraps several causes, and recover with `Effect.catchReason`, `Effect.catchReasons`, or `Effect.unwrapReason` as in the Effect docs.

### Avoid `*FromSelf` schema variants unless you truly need them

Prefer `Schema.Option(ThreadId)` over `OptionFromSelf` for JSON-friendly encoding.

### Prefer `Schema.decodeUnknownEffect` at boundaries

Avoid `decodeUnknownSync` in effectful code paths.

### Prefer `Chunk` when value-based equality matters

Plain arrays are not compared with `Equal` the way `Chunk` is—use `Schema.Chunk(...)` in schemas when that matters.

---

## Error handling

Errors generally flow **adapter / persistence → use case → HTTP handler**, picking up `httpApiStatus` along the way where defined.

### `Effect.catchTag` / `Effect.catchTags` / `Effect.catch`

Use `catchTag` for tagged errors (including an array of tags). Use `catchTags` for a record of handlers. Use `catch` as a final umbrella when you intentionally handle everything left.

### Reason-shaped errors

See `.repos/effect/LLMS.md` (“Creating and handling errors with reasons”) for `catchReason` / `unwrapReason` patterns.

---

## Service pattern (`ServiceMap.Service` + `Layer`)

### Defining ports

Ports are **interfaces only**—one file per port, extending `ServiceMap.Service` with a stable string id:

```typescript
import { Effect, ServiceMap } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { Thread } from "#domain/models/thread.ts";

export class ThreadRepository extends ServiceMap.Service<
  ThreadRepository,
  {
    findById: (
      userId: AuthUserId,
      id: ThreadId,
    ) => Effect.Effect<Option.Option<Thread>, InboxPersistenceError>;
  }
>()("app/ports/ThreadRepository") {}
```

Implementations live under `adapters/*-repository.adapter.ts` and expose a `Layer`, e.g. `ThreadRepositoryLive`, merged in `AdaptersLive`.

### Defining services with `Layer.effect`

Prefer **`Layer.effect` / `Layer.scoped`** for real implementations. Attach static layers on the implementing module or a small registry file.

```typescript
static readonly ThreadRepositoryLive = Layer.effect(
  ThreadRepository,
  Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient;
    const findById = Effect.fn("ThreadRepository.findById")(function* (
      userId: AuthUserId,
      id: ThreadId,
    ) {
      /* ... */
    });
    return ThreadRepository.of({ findById });
  }),
);
```

### `ServiceMap.Reference` for config-shaped values

Use `ServiceMap.Reference` when a default makes sense (feature flags, simple config).

### Dynamic layers

Use `Layer.unwrap` when the layer depends on `Config` or another effect—see `DatabaseLive` in `infrastructure/database/client.ts`.

### Global vs per-request context

- **Global:** pools, repositories, outbound clients—provided by `Layer` at startup.
- **Per-request:** `CurrentUser` / `CurrentSession` from `Authorization` middleware—use `Effect.provideService`, not new layers per request.

---

## Layer memoization and composition

Layers memoize by **reference identity**. Merging the **same** layer value twice shares one instance; two **distinct** `Layer.effect` values of the same type do not.

Use `Layer.fresh` when you intentionally need a new resource instance (uncommon in production; more common in tests).

---

## SQL patterns (`effect/unstable/sql`)

Imports:

```typescript
import { SqlClient, SqlSchema } from "effect/unstable/sql";
import { PgClient } from "@effect/sql-pg";
```

### Decode with Schema, not raw row generics

Do not rely on unchecked `sql<{...}>` row types. Define `Schema.Struct` or use `Model.Class` for full rows, and `SqlSchema.findOne` / `findOneOption` / `findAll` / `void` as appropriate.

This repo uses **`SqlSchema.findOneOption`** heavily for optional single rows and **`SqlSchema.findAll`** for lists.

### SQL helpers

Use `sql.insert`, `sql.update`, `sql.in`, `sql.and`, and transactions via `sql.withTransaction`—see existing adapters.

### Postgres layer

Production wiring uses `PgClient.layer` with config from `Config` (`DatabaseLive` in `infrastructure/database/client.ts`): `transformQueryNames` / `transformResultNames` for camelCase ↔ snake_case.

### `SqlModel.makeRepository`

Effect can generate CRUD from a `Model.Class` via `SqlModel.makeRepository`. **This codebase mostly uses explicit `SqlSchema` helpers and hand-written queries** for nuanced inbox/thread queries—use `SqlModel` only when a straightforward table maps 1:1 and the team agrees.

---

## Use cases and `AuthUserId`

Use cases under `use-cases/` stay **HTTP-agnostic**. They take `userId: AuthUserId` (and other inputs) and yield ports—see `listInboxThreads`, `syncUserThreads`, etc.

**Caller rules:**

- **HTTP handlers** (after `Authorization`): pass `user.id` from `CurrentUser` only—never treat route/body/query `userId` as the authority for “who is acting.”
- **OAuth callback** (`handleOAuthCallback`): use the user id produced by the auth flow after provider verification.
- **Workers** (`inbox-sync-worker`, `auto-label-worker`): use `userId` only from **trusted** job payloads enqueued by our own code; do not trust arbitrary external messages.

Repositories should still scope rows in SQL (`WHERE user_id = …`) where ownership matters.

---

## HTTP middleware context (`CurrentUser`, `CurrentSession`)

`Authorization` middleware (`entrypoints/http/middleware/auth.middleware.ts`) resolves the session cookie and provides:

- `CurrentUser` — `ServiceMap.Service` holding `AuthUser`
- `CurrentSession` — `ServiceMap.Service` holding `Session`

Handlers that require auth should be declared on groups that use this middleware and read `yield* CurrentUser` / `yield* CurrentSession` rather than re-parsing cookies.

---

## Testing (Effect-heavy code)

`@effect/vitest` is available for tests that run `Effect` programs (`it.effect`, `it.layer`, etc.). Some modules use plain **Vitest** for pure helpers—both are acceptable.

For effectful tests, prefer `it.effect` and `assert` from `@effect/vitest`, and `TestClock` from `effect/testing` when time must be deterministic.

Define **`layer(...)`** test scopes when multiple tests share a composed `Layer` (see `@effect/vitest` docs in `.repos/effect/` if needed).

---

## Cross-references

- [API guide](./api-guide.md) — `HttpApi`, handlers, OpenAPI
- [Authentication](../architecture/authentication.md) — OAuth, sessions, middleware
- [AGENTS.md](../../AGENTS.md) — workspace commands and frontend/backend boundaries
