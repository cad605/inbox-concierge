# API Guide

This is the consolidated guide for API development in the Inbox Concierge monorepo, covering Effect HttpApi patterns on the backend and openapi-fetch client usage on the frontend.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Defining API Endpoints (Backend)](#defining-api-endpoints-backend)
3. [Request/Response Schemas](#requestresponse-schemas)
4. [Implementing Handlers](#implementing-handlers)
5. [Authentication & Middleware](#authentication--middleware)
6. [Generated Client (Frontend)](#generated-client-frontend)
7. [Frontend integration (Vite SPA)](#frontend-integration-vite-spa)
8. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---

## Architecture Overview

```
Frontend (openapi-fetch) → API (Effect HttpApi) → Service → Repository → Database
```

**Backend (Effect):**

- `HttpApi` - Define typed API contracts using Schema
- `HttpApiBuilder` - Implement handlers with full type safety
- Auto-generates OpenAPI spec

**Frontend (React):**

- `openapi-fetch` - Type-safe client generated from OpenAPI spec (`@workspace/http` types)
- No Effect runtime in the web app - just typed fetch calls
- The web app is a **Vite SPA** (client-rendered only). This repo does **not** use TanStack Start or server-side rendering for the frontend.
- Use the shared client in `packages/web/src/infrastructure/api-client.ts`: it sets **`credentials: "include"`** so the browser sends httpOnly session cookies on API requests. You do not forward `Cookie` manually in route loaders (unlike SSR setups). If the API is on another origin, configure CORS to allow credentials.

**Key import paths:**

- API definitions: `effect/unstable/httpapi` (HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiBuilder, HttpApiMiddleware, HttpApiSchema, HttpApiClient, HttpApiScalar, HttpApiError, OpenApi)
- HTTP primitives: `effect/unstable/http` (HttpClient, HttpClientRequest, HttpClientResponse, HttpRouter, HttpServer, FetchHttpClient)

---

## Defining API Endpoints (Backend)

### Use Domain Schemas Directly

HttpApi automatically decodes path params, URL params, headers, and payloads. Use domain schemas directly instead of raw strings:

```typescript
import { HttpApiEndpoint } from "effect/unstable/httpapi";

// GOOD: Use AccountId directly - automatic decoding
const getAccount = HttpApiEndpoint.get("getAccount", "/:id", {
  params: { id: AccountId },
  success: Account,
});

// BAD: Raw strings require manual decoding in the handler
const getAccount = HttpApiEndpoint.get("getAccount", "/:id", {
  params: { id: Schema.String },
  success: Account,
});
```

### Creating API Groups

Endpoints use an object-based config with `params`, `query`, `payload`, `success`, and `error` fields:

```typescript
import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

const findById = HttpApiEndpoint.get("findById", "/:id", {
  params: { id: AccountId },
  success: Account,
  error: NotFoundError.pipe(
    HttpApiSchema.asNoContent({
      decode: () => new NotFoundError(),
    }),
  ),
});

const create = HttpApiEndpoint.post("create", "/", {
  payload: Schema.Struct({
    companyId: CompanyId,
    accountType: AccountType,
    parentAccountId: Schema.OptionFromNullOr(AccountId),
  }),
  success: Account,
  error: ValidationError,
});

const list = HttpApiEndpoint.get("list", "/", {
  query: {
    companyId: CompanyId,
    page: Schema.optional(Schema.NumberFromString),
    limit: Schema.optional(Schema.NumberFromString),
  },
  success: Schema.Array(Account),
});

// Group related endpoints - .add() accepts multiple endpoints
class AccountsApi extends HttpApiGroup.make("accounts")
  .add(findById, create, list)
  .prefix("/api/v1/accounts")
  .addError(UnauthorizedError)
  .annotateMerge(
    OpenApi.annotations({
      title: "Accounts",
      description: "Account management endpoints",
    }),
  ) {}

// Compose into full API
import { HttpApi } from "effect/unstable/httpapi";

class AppApi extends HttpApi.make("app")
  .add(AccountsApi)
  .add(CompaniesApi)
  .add(ReportsApi)
  .annotateMerge(
    OpenApi.annotations({
      title: "Inbox Concierge API",
    }),
  ) {}
```

---

## Request/Response Schemas

### Path Parameters

Path parameters are always strings. Use branded schemas, bridging with `Schema.decodeTo` when the domain type differs from the wire format:

```typescript
// String-based branded ID
export const AccountId = Schema.String.pipe(
  Schema.pattern(/^[0-9a-f-]{36}$/),
  Schema.brand("AccountId"),
);

// Numeric path param: bridge from string to branded int
export const UserId = Schema.Int.pipe(Schema.brand("UserId"));

const getUser = HttpApiEndpoint.get("getUser", "/:id", {
  params: {
    id: Schema.FiniteFromString.pipe(Schema.decodeTo(UserId)),
  },
  success: User,
});
```

### URL Query Parameters

Use transforming schemas for non-string types. Defined via the `query` field:

```typescript
const list = HttpApiEndpoint.get("list", "/", {
  query: {
    companyId: CompanyId,
    accountType: Schema.optional(AccountType),
    isActive: Schema.optional(Schema.BooleanFromString),
    limit: Schema.optional(Schema.NumberFromString.pipe(Schema.int(), Schema.greaterThan(0))),
  },
  success: Schema.Array(Account),
});
```

For GET requests, `payload` maps to the query string:

```typescript
const search = HttpApiEndpoint.get("search", "/search", {
  payload: {
    search: Schema.String,
  },
  success: Schema.Array(Account),
});
```

### Request Bodies

For POST/PUT/PATCH, `payload` maps to the JSON request body:

```typescript
const create = HttpApiEndpoint.post("create", "/", {
  payload: Schema.Struct({
    companyId: CompanyId,
    accountType: AccountType,
    parentAccountId: Schema.OptionFromNullOr(AccountId),
  }),
  success: Account,
});
```

### Response Bodies

Return domain entities directly. For multiple content types, pass an array:

```typescript
const getAccount = HttpApiEndpoint.get("getAccount", "/:id", {
  params: { id: AccountId },
  success: Account,
});

// Multiple response content types
const search = HttpApiEndpoint.get("search", "/search", {
  payload: { search: Schema.String },
  success: [
    Schema.Array(Account),
    Schema.String.pipe(HttpApiSchema.asText({ contentType: "text/csv" })),
  ],
});
```

### Error Responses

Define errors using `Schema.TaggedErrorClass` with `httpApiStatus`:

```typescript
import { Schema } from "effect";

class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()(
  "NotFoundError",
  { resource: Schema.String, id: Schema.String },
  { httpApiStatus: 404 },
) {}

class ValidationError extends Schema.TaggedErrorClass<ValidationError>()(
  "ValidationError",
  { errors: Schema.Array(Schema.String) },
  { httpApiStatus: 422 },
) {}

class UnauthorizedError extends Schema.TaggedErrorClass<UnauthorizedError>()(
  "UnauthorizedError",
  {},
  { httpApiStatus: 401 },
) {}
```

Use `HttpApiSchema.asNoContent` for errors that return no body:

```typescript
import { HttpApiSchema } from "effect/unstable/httpapi";

const getById = HttpApiEndpoint.get("getById", "/:id", {
  params: { id: AccountId },
  success: Account,
  error: NotFoundError.pipe(
    HttpApiSchema.asNoContent({
      decode: () => new NotFoundError({ resource: "Account", id: "" }),
    }),
  ),
});
```

Use `HttpApiSchema.status` when you want the error body but need to override the status:

```typescript
const me = HttpApiEndpoint.get("me", "/me", {
  success: User,
  error: UserNotFound.pipe(HttpApiSchema.status(404)),
});
```

Built-in error types are available via `HttpApiError`:

```typescript
import { HttpApiError } from "effect/unstable/httpapi";

// HttpApiError.BadRequest, HttpApiError.RequestTimeoutNoContent, etc.
const search = HttpApiEndpoint.get("search", "/search", {
  payload: { search: Schema.String },
  success: Schema.Array(User),
  error: [SearchQueryTooShort, HttpApiError.RequestTimeoutNoContent],
});
```

### Wrapper Errors with Reasons

Wrap related errors into a single error class to avoid proliferating error types across service boundaries:

```typescript
class UserNotFound extends Schema.TaggedErrorClass<UserNotFound>()(
  "UserNotFound",
  {},
  { httpApiStatus: 404 },
) {}

class SearchQueryTooShort extends Schema.TaggedErrorClass<SearchQueryTooShort>()(
  "SearchQueryTooShort",
  {},
  { httpApiStatus: 422 },
) {}

class UsersError extends Schema.TaggedErrorClass<UsersError>()("UsersError", {
  reason: Schema.Union([UserNotFound, SearchQueryTooShort]),
}) {}
```

---

## Implementing Handlers

Use `Effect.fn` as the group body to access services via generators. Handler callbacks receive destructured request parts (`params`, `query`, `payload`):

```typescript
import { Effect, Layer } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

const AccountsHandlers = HttpApiBuilder.group(
  AppApi,
  "accounts",
  Effect.fn(function* (handlers) {
    const service = yield* AccountService;

    return handlers
      .handle("findById", ({ params }) =>
        service.findById(params.id).pipe(
          Effect.catchReasons(
            "AccountsError",
            {
              AccountNotFound: Effect.fail,
            },
            Effect.die,
          ),
        ),
      )
      .handle("create", ({ payload }) => service.create(payload).pipe(Effect.orDie))
      .handle("list", ({ query }) =>
        service
          .list({
            companyId: query.companyId,
            page: query.page ?? 1,
            limit: query.limit ?? 20,
          })
          .pipe(Effect.orDie),
      );
  }),
).pipe(Layer.provide(AccountService.layer));
```

### Composing into a Server

Use `HttpApiBuilder.layer` (not `HttpApiBuilder.api`) and `HttpRouter.serve`:

```typescript
import { Layer } from "effect";
import { HttpRouter } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { NodeHttpServer } from "@effect/platform-node";
import { createServer } from "node:http";

const ApiRoutes = HttpApiBuilder.layer(AppApi, {
  openapiPath: "/openapi.json",
}).pipe(Layer.provide([AccountsHandlers, CompaniesHandlers, ReportsHandlers]));

const DocsRoute = HttpApiScalar.layer(AppApi, { path: "/docs" });

const AllRoutes = Layer.mergeAll(ApiRoutes, DocsRoute);

const HttpServerLayer = HttpRouter.serve(AllRoutes).pipe(
  Layer.provide(NodeHttpServer.layer(createServer, { port: 3000 })),
);

// Or create a web handler for serverless
export const { handler, dispose } = HttpRouter.toWebHandler(
  AllRoutes.pipe(Layer.provide(HttpServer.layerServices)),
);
```

---

## Authentication & Middleware

### Middleware Definition

Define middleware with `HttpApiMiddleware.Service`. It can provide services (like the current user) and declare security schemes:

```typescript
import { Schema, ServiceMap } from "effect";
import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";

class CurrentUser extends ServiceMap.Service<CurrentUser, User>()(
  "app/HttpApi/Authorization/CurrentUser",
) {}

class UnauthorizedError extends Schema.TaggedErrorClass<UnauthorizedError>()(
  "UnauthorizedError",
  { message: Schema.String },
  { httpApiStatus: 401 },
) {}

class Authorization extends HttpApiMiddleware.Service<
  Authorization,
  {
    provides: CurrentUser;
    requires: never;
  }
>()("app/HttpApi/Authorization", {
  requiredForClient: true,
  security: {
    cookie: HttpApiSecurity.apiKey({ key: "session", in: "cookie" }),
  },
  error: UnauthorizedError,
}) {}
```

### Middleware Implementation

The implementation is a separate Layer to avoid leaking server code into clients:

```typescript
import { Effect, Layer, Redacted } from "effect";

const AuthorizationLayer = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    return Authorization.of({
      cookie: Effect.fn(function* (httpEffect, { credential }) {
        const token = Redacted.value(credential);
        const authService = yield* AuthService;
        const user = yield* authService
          .validateSession(token)
          .pipe(Effect.mapError(() => new UnauthorizedError({ message: "Invalid session" })));

        return yield* Effect.provideService(httpEffect, CurrentUser, user);
      }),
    });
  }),
);
```

### Applying Middleware to Groups

```typescript
class SecureApi extends HttpApiGroup.make("secure")
  .add(protectedEndpoint)
  .middleware(Authorization) {}
```

### Setting Cookies in Responses

```typescript
HttpServerResponse.setCookie("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
});
```

---

## Generated Client (Frontend)

### Client Generation

```bash
# Export OpenAPI from the backend and regenerate TypeScript types for @workspace/http
bun api:sync
```

Partial steps: `bun backend:openapi:export` (spec JSON), then `bun http:openapi:types` (types consumed by openapi-fetch).

### Making API Calls

```typescript
import { api } from "#infrastructure/api-client.ts";

// GET with query params
const { data, error } = await api.GET("/api/v1/accounts", {
  params: {
    query: { companyId: "comp_123", page: 1, limit: 20 },
  },
});

// GET with path params
const { data, error } = await api.GET("/api/v1/accounts/{accountId}", {
  params: {
    path: { accountId: "acc_456" },
  },
});

// POST
const { data, error } = await api.POST("/api/v1/accounts", {
  body: {
    name: "Cash",
    type: "Asset",
    companyId: "comp_123",
  },
});

// PATCH
const { data, error } = await api.PATCH("/api/v1/accounts/{accountId}", {
  params: { path: { accountId: "acc_456" } },
  body: { name: "Updated Name" },
});

// DELETE
const { data, error } = await api.DELETE("/api/v1/accounts/{accountId}", {
  params: { path: { accountId: "acc_456" } },
});
```

### Error Handling

```typescript
import { redirect } from "@tanstack/react-router";

const { data, error } = await api.POST("/api/v1/accounts", { body });

if (error) {
  if (error.status === 422) {
    // ValidationError
    console.log(error.body.errors);
  } else if (error.status === 401) {
    // UnauthorizedError — client-side navigation (Vite SPA)
    throw redirect({ to: "/login" });
  } else if (error.status === 404) {
    // NotFoundError
    console.log(error.body.message);
  }
  return;
}

// data is typed as the success response
console.log(data.id, data.name);
```

---

## Frontend integration (Vite SPA)

Server data in this repo uses **TanStack Query** and **TanStack Router** loaders in the browser. For full patterns (search params, auth guards, TanStack DB, forms), see [frontend-guide.md](./frontend-guide.md).

### Data loading: `ensureQueryData` + `useSuspenseQuery`

Define `queryOptions` that call `api`, preload in the route `loader`, and read in the component:

```typescript
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { api } from "#infrastructure/api-client.ts";

export const organizationsQueryOptions = queryOptions({
  queryKey: ["organizations"],
  queryFn: async () => {
    const { data, error } = await api.GET("/api/v1/organizations");
    if (error) throw new Error("Failed to load organizations");
    return data ?? [];
  },
});

export const Route = createFileRoute("/organizations/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(organizationsQueryOptions),
  component: OrganizationsPage,
});

function OrganizationsPage() {
  const { data: organizations } = useSuspenseQuery(organizationsQueryOptions);
  return (
    <ul>
      {organizations.map((org) => (
        <li key={org.id}>{org.name}</li>
      ))}
    </ul>
  );
}
```

Cookies are sent automatically by the browser because `api` uses `credentials: "include"` — no manual `Cookie` header in loaders.

### Auth

Use `beforeLoad` on protected layouts to enforce auth (see frontend guide). Session endpoints use the same `api` client; httpOnly cookies apply without SSR forwarding.

### Mutations and cache

Prefer **`useMutation`** with `api.POST` / `api.PATCH`, then `queryClient.invalidateQueries` and/or `router.invalidate()` from `@tanstack/react-router`. Example:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import { api } from "#infrastructure/api-client.ts";

function CreateOrganizationForm() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await api.POST("/api/v1/organizations", { body: { name } });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      await router.invalidate();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate(/* name from form state */);
      }}
    >
      ...
    </form>
  );
}
```

---

## Anti-Patterns to Avoid

### DO NOT Use Raw fetch()

```typescript
// WRONG - bypasses type safety
const response = await fetch("/api/v1/organizations");
const data = await response.json();

// CORRECT - use typed client
const { data, error } = await api.GET("/api/v1/organizations");
```

### DO NOT Store Tokens in localStorage

```typescript
// WRONG - vulnerable to XSS
localStorage.setItem("token", response.token);
headers: {
  Authorization: `Bearer ${localStorage.getItem("token")}`;
}

// CORRECT - server sets httpOnly cookie, browser sends automatically
await api.POST("/api/auth/login", { body: { email, password } });
```

### DO NOT Return Tokens in Response Body

```typescript
// WRONG - token can be stolen by XSS
return { token: sessionToken, user: { ... } }

// CORRECT - set token in httpOnly cookie only
HttpServerResponse.setCookie("session", token, {
  httpOnly: true,
  secure: true,
  sameSite: "strict"
})
return { user: { id, email, displayName } }
```

### DO NOT Use TanStack Start server functions for API calls

This repo does not use TanStack Start. Do not replace HTTP calls with server-only RPC helpers; use **TanStack Query** (`queryOptions`, `useMutation`) and **`api`** from `#infrastructure/api-client.ts`, with **`ensureQueryData`** in route loaders where appropriate.

```typescript
import { queryOptions } from "@tanstack/react-query";

import { api } from "#infrastructure/api-client.ts";

// WRONG — server function indirection instead of calling the API the app already exposes
const fetchData = createServerFn({ method: "GET" }).handler(async () => {
  /* ... */
});

// CORRECT — query factory + loader preload (cookies via credentials: "include")
export const dataQueryOptions = queryOptions({
  queryKey: ["data"],
  queryFn: async () => {
    const { data, error } = await api.GET("/api/v1/data");
    if (error) throw error;
    return data;
  },
});

// In route:
loader: ({ context }) => context.queryClient.ensureQueryData(dataQueryOptions),
```

### DO NOT Manually Decode in Handlers

```typescript
// WRONG - manual decoding in handler
.handle("getAccount", (_) =>
  Effect.gen(function* () {
    const accountId = yield* Schema.decodeUnknown(AccountId)(_.path.id)
    // ...
  })
)

// CORRECT - use domain schema in endpoint definition
HttpApiEndpoint.get("getAccount", "/:id", {
  params: { id: AccountId },
  success: Account
})

// Handler receives already-decoded params
.handle("getAccount", ({ params }) =>
  service.findById(params.id)
)
```

### DO NOT Use HttpApiBuilder.api (old API)

```typescript
// WRONG - old API
const ApiLive = HttpApiBuilder.api(AppApi).pipe(Layer.provide([AccountsLive, CompaniesLive]));

// CORRECT - use HttpApiBuilder.layer
const ApiRoutes = HttpApiBuilder.layer(AppApi, {
  openapiPath: "/openapi.json",
}).pipe(Layer.provide([AccountsHandlers, CompaniesHandlers]));
```

### DO NOT Chain .setPath/.addSuccess/.addError (old API)

```typescript
// WRONG - old chaining API
const getAccount = HttpApiEndpoint.get("getAccount", "/:id")
  .setPath(Schema.Struct({ id: AccountId }))
  .addSuccess(Account)
  .addError(NotFoundError);

// CORRECT - use object config
const getAccount = HttpApiEndpoint.get("getAccount", "/:id", {
  params: { id: AccountId },
  success: Account,
  error: NotFoundError,
});
```

---

## API Definition Checklist

1. **Path params**: Use branded schemas in the `params` field; bridge with `Schema.decodeTo` when needed
2. **Query params**: Use branded strings + transforming schemas in the `query` field (`BooleanFromString`, `NumberFromString`)
3. **Request body**: Use domain schemas in `payload` with `OptionFromNullOr` for optional fields
4. **Response body**: Return domain entities via `success`, or use an array for multiple content types
5. **Errors**: Define with `Schema.TaggedErrorClass` and `{ httpApiStatus: ... }`; use `HttpApiSchema.asNoContent` for bodyless errors
6. **No manual decoding**: If calling `Schema.decode*` in a handler, reconsider the API schema
7. **Browser cookies**: Keep `credentials: "include"` on the openapi-fetch client (see `api-client.ts`); configure CORS if the API origin differs from the web app
8. **Use Effect.fn**: Group handlers should use `Effect.fn(function*(handlers) { ... })` to access services
9. **Separate API definitions from server code**: API schemas and endpoint definitions should live in a shared package, not alongside handler implementations
