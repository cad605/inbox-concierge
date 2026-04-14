# Frontend Guide

This is the consolidated guide for frontend development in the Inbox Concierge project, covering React patterns, routing, data fetching, forms, client-side reactive state, and UI components.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Routing with TanStack Router](#routing-with-tanstack-router)
3. [Server State with TanStack Query](#server-state-with-tanstack-query)
4. [Client State with TanStack DB](#client-state-with-tanstack-db)
5. [Forms with TanStack Form](#forms-with-tanstack-form)
6. [UI Components with Chakra UI](#ui-components-with-chakra-ui)
7. [State Management Summary](#state-management-summary)
8. [Page Templates](#page-templates)
9. [Empty, Loading, and Error States](#empty-loading-and-error-states)
10. [Navigation & Layout](#navigation--layout)
11. [Accessibility](#accessibility)

---

## Architecture Overview

**No Effect runtime in frontend** (no `Effect.gen`, services, or pipelines in React). The frontend uses:

- **TanStack Router** — Type-safe file-based routing with SWR caching
- **TanStack Query** — Server state management (fetching, caching, mutations)
- **TanStack Form** — Type-safe form state, validation, and submission
- **TanStack DB** — Reactive client-side data store with optimistic mutations (see below for Effect `Schema` on collection rows only)
- **Chakra UI** — Component library for styling and layout

**Data Flow:**

```
Frontend (TanStack Query / openapi-fetch; TanStack DB Query Collections) → API (Effect HttpApi) → Service → Repository → Database
```

This app is a **Vite SPA** (not TanStack Start). TanStack DB collections are **client-only**; use `preload()` in route loaders and `useLiveQuery` in components. Setting `ssr: false` on routes matches TanStack DB docs; on a pure client-rendered app it documents intent, while on SSR-capable stacks it prevents loaders from running `preload()` on the server.

### File Structure

Layout follows the same hex-style boundaries as `.repos/hex-arch-patterns/apps/dashboard` (`infrastructure/`, `features/`, `ui/`). **Imports** use the `#*` alias from `packages/web/package.json` (`"#*": "./src/*"`), e.g. `#infrastructure/api-client.ts`, not `@/`.

```
packages/web/src/
├── main.tsx             # DOM bootstrap, shell providers, RouterProvider
├── router.ts            # createRouter, route masks, Register augmentation
├── provider.tsx         # Chakra and other app-wide shell (non-router)
├── routes/              # TanStack Router file-based routing
│   ├── __root.tsx       # Root layout, QueryClientProvider, devtools
│   ├── _public.tsx      # Unauthenticated layout (e.g. sign-in branch)
│   ├── _public/
│   ├── _authenticated.tsx  # Auth guard (pathless layout)
│   └── _authenticated/  # Protected routes
├── ui/                  # Shared UI (Chakra snippets, shell widgets)
├── features/            # Feature modules — add as needed
├── infrastructure/      # api-client, env, query-client, query-keys, auth session query, hooks
│   ├── auth/            # e.g. me-query.ts (authMeQueryOptions)
│   ├── collections/     # TanStack DB Query Collections — add as needed
│   └── hooks/           # e.g. use-auth.ts (useAuthUser, useSignOut)
├── lib/                 # Utilities and shared schemas
├── types/               # Ambient types (e.g. globals.d.ts)
└── theme.ts             # Chakra system theme
```

### Reference Repos

Best practices for these libraries live in `.repos/`:

| Library         | Reference Path                                                                              | Notes                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| TanStack Router | `.repos/tanstack-router/packages/react-router/skills/`                                      | See `router-core/` sub-skills for data loading, search params, auth, etc.                                             |
| TanStack Query  | `.repos/tanstack-query/`                                                                    | See examples in `examples/react/`                                                                                     |
| TanStack Form   | `.repos/tanstack-form/docs/framework/react/`                                                | See `guides/` for validation, composition, arrays                                                                     |
| TanStack DB     | `.repos/tanstack-db/packages/react-db/skills/` and `.repos/tanstack-db/packages/db/skills/` | **Query Collection** (`@tanstack/query-db-collection`): `db-core/` for setup, `meta-framework/` for preload + loaders |
| Chakra UI       | `.repos/chakra-ui/`                                                                         | Also use the `user-chakra-ui` MCP server for component examples and props                                             |

---

## Routing with TanStack Router

Use file-based routing with the Vite plugin. Types are **fully inferred** — never annotate inferred values.

### Route File Convention

```tsx
// src/routes/posts.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/posts")({
  component: PostsPage,
});

function PostsPage() {
  return <h1>Posts</h1>;
}
```

The `createFileRoute` path string must match the file's location. The Vite plugin manages this automatically — never edit it by hand.

### Search Params

Treat search params as validated, typed state. Use Zod for validation:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().default(1).catch(1),
  status: z.enum(["active", "archived"]).default("active").catch("active"),
});

export const Route = createFileRoute("/entries/")({
  validateSearch: searchSchema,
  component: EntriesPage,
});

function EntriesPage() {
  const { page, status } = Route.useSearch();
  return (
    <div>
      Page {page}, Status: {status}
    </div>
  );
}
```

When writing search params, use the function form to preserve existing params:

```tsx
<Link to="." search={(prev) => ({ ...prev, page: prev.page + 1 })}>
  Next Page
</Link>
```

### Auth Guards with Layout Routes

Protect routes using `beforeLoad` in a pathless layout route:

```tsx
// src/routes/_authenticated.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
});
```

Place protected route files under `src/routes/_authenticated/`. Auth state flows via router context — see `.repos/tanstack-router/packages/router-core/skills/router-core/auth-and-guards/SKILL.md`.

### Router Context with TanStack Query

Inject `QueryClient` into the router for loader access:

```tsx
// src/router.tsx
import { createRouter, createRootRouteWithContext } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0,
  defaultPreload: "intent",
  context: { queryClient },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

### Navigation

Prefer `<Link>` for clickable elements. Use `useNavigate` only for programmatic side-effect navigation:

```tsx
import { Link, useNavigate } from "@tanstack/react-router";

// User-clickable — use Link
<Link to="/posts/$postId" params={{ postId }}>
  View Post
</Link>;

// After form submit — use navigate
const navigate = useNavigate();
navigate({ to: "/posts/$postId", params: { postId } });
```

**Never interpolate params into the `to` string** — always use the `params` option.

### Anti-Patterns

```tsx
// DON'T interpolate params
<Link to={`/posts/${postId}`}>Post</Link>;

// DON'T use React hooks in beforeLoad or loader
beforeLoad: () => {
  const auth = useAuth();
}; // WRONG

// DON'T manually edit createFileRoute path strings
```

---

## Server State with TanStack Query

Use TanStack Query for all server data fetching and mutations. Define query options as reusable factories.

### Query Options Pattern

```tsx
// src/queries/posts.ts
import { queryOptions } from "@tanstack/react-query";
import { api } from "../api/client";

export const postsQueryOptions = queryOptions({
  queryKey: ["posts"],
  queryFn: async () => {
    const { data } = await api.GET("/api/v1/posts");
    return data ?? [];
  },
});

export const postQueryOptions = (postId: string) =>
  queryOptions({
    queryKey: ["posts", postId],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/posts/{id}", {
        params: { path: { id: postId } },
      });
      return data;
    },
  });
```

### Data Loading: `ensureQueryData` in Loader + `useSuspenseQuery` in Component

This is the standard pattern. The loader seeds the cache before render. The component subscribes for updates.

```tsx
// src/routes/posts.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { postsQueryOptions } from "../queries/posts";

export const Route = createFileRoute("/posts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQueryOptions),
  component: PostsPage,
});

function PostsPage() {
  const { data: posts } = useSuspenseQuery(postsQueryOptions);
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### Parallel Data Loading

```tsx
export const Route = createFileRoute("/dashboard")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(statsQueryOptions),
      context.queryClient.ensureQueryData(recentActivityQueryOptions),
    ]),
  component: DashboardPage,
});
```

### Mutations

```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

function CreatePostButton() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (body: { title: string }) => {
      const { data } = await api.POST("/api/v1/posts", { body });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      router.invalidate();
    },
  });

  return <Button onClick={() => mutation.mutate({ title: "New Post" })}>Create</Button>;
}
```

### Streaming Non-Critical Data

Use `prefetchQuery` (not awaited) for non-critical data that can load after navigation:

```tsx
export const Route = createFileRoute("/dashboard")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(userQueryOptions);
    context.queryClient.prefetchQuery(analyticsQueryOptions); // fire-and-forget
  },
  component: Dashboard,
});
```

### Anti-Patterns

```tsx
// DON'T fetch data in useEffect
useEffect(() => {
  api.GET("/api/v1/items").then(({ data }) => setData(data));
}, []);

// DON'T store server data in useState
const { items } = Route.useLoaderData();
const [localItems, setLocalItems] = useState(items);

// DON'T manage async state manually
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [data, setData] = useState(null);

// DON'T forget defaultPreloadStaleTime: 0 when using Query with Router
const router = createRouter({ routeTree }); // WRONG — Router's cache conflicts with Query
```

---

## Client State with TanStack DB

Use TanStack DB for reactive client-side collections that need live queries or optimistic mutations. This project standardizes on the **Query Collection** adapter (`queryCollectionOptions` from `@tanstack/query-db-collection`): list data through TanStack Query (`queryKey` / `queryFn` → `openapi-fetch`), then persist inserts/updates/deletes in `onInsert` / `onUpdate` / `onDelete` and **`refetch()`** to reconcile with the server.

Collections are **client-side only**. Use **`await collection.preload()`** in the route `loader`, then **`useLiveSuspenseQuery`** inside **`Suspense`** and **`ErrorBoundary`** in the component (see TanStack DB React docs). Set **`ssr: false`** on routes that use collections so SSR-capable stacks never run `preload()` on the server; on a Vite-only SPA, loaders already run in the browser.

**Shared `QueryClient`:** Import the app singleton from `#infrastructure/query-client.ts` into every collection module. Do **not** instantiate a second `QueryClient` inside collection files.

**Row validation:** Use **Effect `Schema`** and **`Schema.toStandardSchemaV1(...)`** as the collection `schema` (Standard Schema v1). Do not add Zod for collection rows unless you have a separate reason.

### Collection Setup (Query Collection)

Define collections as singletons in a shared module:

```tsx
// src/infrastructure/collections/example.ts
import { queryCollectionOptions } from "@tanstack/query-db-collection";
import { createCollection } from "@tanstack/react-db";
import { Schema } from "effect";

import { api } from "#infrastructure/api-client.ts";
import { queryClient } from "#infrastructure/query-client.ts";

const ItemSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
});

const itemStandardSchema = Schema.toStandardSchemaV1(ItemSchema);

export const itemCollection = createCollection(
  queryCollectionOptions({
    id: "items",
    queryKey: ["items"],
    queryFn: async () => {
      const { data, response } = await api.GET("/api/items");
      if (!response.ok) throw new Error("Failed to load items");
      return data ?? [];
    },
    queryClient,
    getKey: (item) => item.id,
    schema: itemStandardSchema,
    onInsert: async ({ transaction }) => {
      for (const m of transaction.mutations) {
        await api.POST("/api/items", { body: m.modified });
      }
      await itemCollection.utils.refetch();
    },
  }),
);
```

### Route Integration

```tsx
// src/routes/_authenticated/items.tsx
import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { itemCollection } from "#infrastructure/collections/example.ts";
import { ErrorBoundary } from "#ui/error-boundary.tsx";

export const Route = createFileRoute("/_authenticated/items")({
  component: ItemsPage,
  loader: async () => {
    await itemCollection.preload();
  },
  ssr: false,
});

function ItemsPage() {
  return (
    <ErrorBoundary fallbackRender={({ reset }) => <div>Failed to load</div>}>
      <Suspense fallback={<Skeleton />}>
        <ItemsList />
      </Suspense>
    </ErrorBoundary>
  );
}

function ItemsList() {
  const { data: items } = useLiveSuspenseQuery((q) => q.from({ item: itemCollection }), []);

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

For filters and `orderBy`, use the query builder APIs from `@tanstack/react-db` (see `.repos/tanstack-db/docs/guides/live-queries.md`).

### Optimistic Mutations

Use Immer-style draft proxies — do NOT reassign:

```tsx
todoCollection.update(todo.id, (draft) => {
  draft.completed = true;
});

todoCollection.insert({
  id: crypto.randomUUID(),
  text: "New todo",
  completed: false,
});

todoCollection.delete(todo.id);
```

### Dependency Arrays

Include all external reactive values used in query closures:

```tsx
const { data } = useLiveSuspenseQuery(
  (q) => q.from({ todo: todoCollection }).where(({ todo }) => eq(todo.userId, userId)),
  [userId],
);
```

For queries with **no external dependencies**, pass an explicit **empty dependency array** `[]` so it is obvious the live query is static (same guidance as TanStack DB React docs).

### Loading and errors (`useLiveSuspenseQuery` vs `useLiveQuery`)

**Default:** use **`useLiveSuspenseQuery`** with **`Suspense`** (Chakra skeleton or spinner fallback) and **`ErrorBoundary`** (see [`packages/web/src/ui/error-boundary.tsx`](packages/web/src/ui/error-boundary.tsx)) so first-load loading and errors match TanStack DB React guidance. Retries call **`collection.utils.refetch()`** (and **`reset()`** on the boundary when applicable).

**Exceptions:**

- **`useLiveInfiniteQuery`** for paginated live lists (inbox threads) until the library provides a suspense infinite API.
- **`useLiveQuery`** when a query must be **disabled** (`undefined` / `null` callback) or you need **`isEnabled`** — `useLiveSuspenseQuery` does not support disabled queries.

### Package: `@tanstack/react-db` only

In `packages/web`, declare **`@tanstack/react-db`** as the direct TanStack DB dependency. It re-exports **`@tanstack/db`**, so import types and values (for example `LoadSubsetOptions`, `createCollection`, query operators) from **`@tanstack/react-db`** and avoid a second direct **`@tanstack/db`** dependency, which reduces the risk of two physical copies of the library and `instanceof` mismatches.

---

## Forms with TanStack Form

Use TanStack Form for all form state management. It provides type-safe fields, validation via Standard Schema (Zod), and composable form hooks.

### App-Wide Form Hook

Create a shared form hook with pre-bound field components for consistency:

```tsx
// src/hooks/form.ts
import { createFormHookContexts, createFormHook } from "@tanstack/react-form";
import { TextField, NumberField, SubmitButton } from "../components/ui";

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    TextField,
    NumberField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
});
```

### Field Components with Chakra UI

Build field components that use `useFieldContext` and Chakra UI:

```tsx
// src/components/ui/text-field.tsx
import { Field, Input } from "@chakra-ui/react";
import { useFieldContext } from "../../hooks/form";

export function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>();
  return (
    <Field.Root invalid={field.state.meta.isTouched && !field.state.meta.isValid}>
      <Field.Label>{label}</Field.Label>
      <Input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
        <Field.ErrorText>{field.state.meta.errors.join(", ")}</Field.ErrorText>
      )}
    </Field.Root>
  );
}
```

### Using Forms in Pages

```tsx
import { useAppForm } from "../../hooks/form";
import { z } from "zod";

function CreateOrganizationForm() {
  const form = useAppForm({
    defaultValues: {
      name: "",
      description: "",
    },
    validators: {
      onChange: z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string(),
      }),
    },
    onSubmit: async ({ value }) => {
      await api.POST("/api/v1/organizations", { body: value });
      router.invalidate();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.AppField
        name="name"
        children={(field) => <field.TextField label="Organization Name" />}
      />
      <form.AppField
        name="description"
        children={(field) => <field.TextField label="Description" />}
      />
      <form.AppForm>
        <form.SubmitButton />
      </form.AppForm>
    </form>
  );
}
```

### Breaking Large Forms into Pieces

Use `withForm` to split forms across files while keeping type safety:

```tsx
const AddressSection = withForm({
  defaultValues: {
    street: "",
    city: "",
    state: "",
    zip: "",
  },
  render: function Render({ form }) {
    return (
      <Stack gap={4}>
        <form.AppField name="street" children={(field) => <field.TextField label="Street" />} />
        <form.AppField name="city" children={(field) => <field.TextField label="City" />} />
      </Stack>
    );
  },
});
```

### Validation

- Use Zod schemas with `validators.onChange` for form-wide validation
- Use per-field `validators` for field-specific rules
- Async validation is supported with `onChangeAsync` and `onChangeAsyncDebounceMs`
- Access `field.state.meta.errors`, `field.state.meta.isTouched`, `field.state.meta.isValidating`

### Submission State

Use `form.Subscribe` to reactively track submission state:

```tsx
<form.Subscribe
  selector={(state) => [state.canSubmit, state.isSubmitting]}
  children={([canSubmit, isSubmitting]) => (
    <Button type="submit" disabled={!canSubmit} loading={isSubmitting}>
      {isSubmitting ? "Submitting..." : "Submit"}
    </Button>
  )}
/>
```

### Anti-Patterns

```tsx
// DON'T manually manage form state with useState
const [name, setName] = useState('')
const [isSubmitting, setIsSubmitting] = useState(false)

// DON'T use useField for reactivity — use form.Subscribe or useStore(form.store)
const field = useField({ name: 'firstName' })

// DON'T forget e.preventDefault() on form submit
<form onSubmit={() => form.handleSubmit()}> // WRONG — page will reload
```

---

## UI Components with Chakra UI

Use Chakra UI for all UI components. Consult the `user-chakra-ui` MCP server for component examples, props, and theme customization.

### Key Principles

- **Use Chakra components instead of raw HTML** — `<Button>`, `<Input>`, `<Stack>`, not `<button>`, `<input>`, `<div>`
- **Use Chakra's style props** for spacing, colors, typography — not raw CSS or Tailwind
- **Use composition** — Chakra components compose via children, not giant prop APIs
- **Use Chakra's Field component** for form fields with labels, errors, and help text

### Common Components

| Need              | Chakra Component                                                      |
| ----------------- | --------------------------------------------------------------------- |
| Buttons           | `Button`                                                              |
| Text inputs       | `Input`, `Textarea`                                                   |
| Form fields       | `Field.Root`, `Field.Label`, `Field.ErrorText`                        |
| Layout            | `Stack`, `HStack`, `VStack`, `Flex`, `Grid`, `Box`, `Container`       |
| Cards             | `Card.Root`, `Card.Header`, `Card.Body`                               |
| Tables            | `Table.Root`, `Table.Header`, `Table.Body`, `Table.Row`, `Table.Cell` |
| Dialogs           | `Dialog.Root`, `Dialog.Content`, `Dialog.Header`, `Dialog.Body`       |
| Navigation        | `Breadcrumb`, `Tabs`, `Menu`                                          |
| Feedback          | `Alert`, `Toast`, `Skeleton`, `Spinner`                               |
| Empty states      | `EmptyState`                                                          |
| Status indicators | `Badge`, `Status`, `Tag`                                              |

### Layout with Stack

```tsx
import { Stack, HStack, VStack } from "@chakra-ui/react";

<Stack gap={4}>
  <HStack justify="space-between">
    <Heading size="lg">Organizations</Heading>
    <Button>Create</Button>
  </HStack>
  <Box>{/* content */}</Box>
</Stack>;
```

### Cards

```tsx
import { Card, Stack } from "@chakra-ui/react";

<Card.Root>
  <Card.Header>
    <Card.Title>Organization Details</Card.Title>
  </Card.Header>
  <Card.Body>
    <Stack gap={3}>{/* content */}</Stack>
  </Card.Body>
</Card.Root>;
```

### Responsive Design

Use Chakra's responsive style props:

```tsx
<Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
  {items.map((item) => (
    <Card.Root key={item.id}>{/* ... */}</Card.Root>
  ))}
</Grid>
```

---

## State Management Summary

| State Type                | Tool                          | When to Use                                            |
| ------------------------- | ----------------------------- | ------------------------------------------------------ |
| **Server state**          | TanStack Query                | API data fetching, caching, mutations                  |
| **URL state**             | TanStack Router search params | Shareable state (filters, pagination, sort)            |
| **Form state**            | TanStack Form                 | Form inputs, validation, submission                    |
| **Reactive client state** | TanStack DB                   | Collections needing live queries, optimistic mutations |
| **Local UI state**        | `useState`                    | Ephemeral UI toggles (modals, dropdowns)               |

---

## Page Templates

### List Page Template

```
+------------------------------------------+
|  [Breadcrumbs]                           |
|  Page Title                              |
|  [Optional: Description]                 |
+------------------------------------------+
|  [Filters/Search] [Primary Action Button]|
+------------------------------------------+
|  +------------------------------------+  |
|  | Data Table / Card Grid             |  |
|  | - Column headers with tooltips     |  |
|  | - Row actions                      |  |
|  | - Pagination                       |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Detail Page Template

```
+------------------------------------------+
|  [Breadcrumbs]                           |
|  Title [Status Badge]         [Actions]  |
+------------------------------------------+
|  +------------------------------------+  |
|  | Info Card                          |  |
|  | Key-value pairs in grid            |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  | Related Data Section               |  |
|  | Table with row actions             |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Form Page Template

```
+------------------------------------------+
|  [Breadcrumbs]                           |
|  Create/Edit [Entity]                    |
+------------------------------------------+
|  +------------------------------------+  |
|  | Form Card                          |  |
|  | - Form fields with labels          |  |
|  | - Validation messages              |  |
|  | - [Cancel] [Submit]                |  |
|  +------------------------------------+  |
+------------------------------------------+
```

---

## Empty, Loading, and Error States

### Empty States

Every list page must have an empty state. Use Chakra's `EmptyState` component:

```tsx
import { EmptyState } from "@chakra-ui/react";

<EmptyState.Root>
  <EmptyState.Content>
    <EmptyState.Indicator>
      <LuBuilding2 />
    </EmptyState.Indicator>
    <EmptyState.Title>No organizations yet</EmptyState.Title>
    <EmptyState.Description>Create your first organization to get started.</EmptyState.Description>
  </EmptyState.Content>
  <Button>Create Organization</Button>
</EmptyState.Root>;
```

### Loading States

Use Chakra's `Skeleton` component to match content layout:

```tsx
import { Skeleton, Stack } from "@chakra-ui/react";

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack gap={3}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="16" />
      ))}
    </Stack>
  );
}
```

For TanStack Router, use the `pendingComponent` route option:

```tsx
export const Route = createFileRoute("/posts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQueryOptions),
  pendingMs: 500,
  pendingMinMs: 300,
  pendingComponent: () => <TableSkeleton />,
  component: PostsPage,
});
```

### Error States

Use `errorComponent` on routes. Every error must answer: WHAT happened, WHY, and WHAT to do:

```tsx
export const Route = createFileRoute("/posts")({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQueryOptions),
  errorComponent: ({ error }) => {
    const router = useRouter();
    return (
      <Alert.Root status="error">
        <Alert.Title>Unable to load posts</Alert.Title>
        <Alert.Description>{error.message}</Alert.Description>
        <Button onClick={() => router.invalidate()}>Retry</Button>
      </Alert.Root>
    );
  },
  component: PostsPage,
});
```

Use `router.invalidate()` to retry — NOT `reset()`, which only clears the boundary without re-running the loader.

**Specific error messages:**

| Scenario       | Bad                      | Good                                         |
| -------------- | ------------------------ | -------------------------------------------- |
| Email exists   | "Error creating account" | "An account with this email already exists." |
| Wrong password | "Invalid credentials"    | "Incorrect password. Forgot your password?"  |
| Network error  | "Request failed"         | "Unable to connect. Check your internet."    |

---

## Navigation & Layout

### AppLayout

All authenticated pages use `AppLayout` with sidebar and header, implemented as the `_authenticated` layout route:

```tsx
// src/routes/_authenticated.tsx
function AuthenticatedLayout() {
  return (
    <Flex h="100vh">
      <Sidebar />
      <Flex flex={1} direction="column">
        <Header />
        <Box as="main" flex={1} overflow="auto" p={6}>
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
}
```

### Breadcrumbs

Use the Chakra `Breadcrumb` component for pages 2+ levels deep:

```tsx
import { Breadcrumb } from "@chakra-ui/react";

<Breadcrumb.Root>
  <Breadcrumb.List>
    <Breadcrumb.Item>
      <Breadcrumb.Link asChild>
        <Link to="/organizations">Organizations</Link>
      </Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.CurrentLink>{orgName}</Breadcrumb.CurrentLink>
    </Breadcrumb.Item>
  </Breadcrumb.List>
</Breadcrumb.Root>;
```

### Active Route Highlighting

TanStack Router's `<Link>` supports `activeProps` and `data-status="active"`:

```tsx
<Link to="/dashboard" activeProps={{ fontWeight: "bold" }} inactiveProps={{ color: "fg.muted" }}>
  Dashboard
</Link>
```

---

## Accessibility

### Keyboard Navigation

Chakra UI components are keyboard-accessible by default. When building custom interactive elements:

```tsx
<Box
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }}
  onClick={onClick}
>
```

### ARIA Labels

```tsx
<IconButton aria-label="Close modal" variant="ghost">
  <LuX />
</IconButton>
```

### Touch Targets

Minimum touch target size is 44x44 pixels. Chakra's default button sizes satisfy this.

---

## Quick Reference Checklist

Before marking any UI task complete:

### Navigation

- [ ] Logo links to home
- [ ] Breadcrumbs on nested pages
- [ ] Active route highlighted

### Forms (TanStack Form)

- [ ] Uses `useAppForm` with `createFormHook` pattern
- [ ] Zod schema for validation via `validators.onChange`
- [ ] Error messages shown via `field.state.meta.errors`
- [ ] Submit button disabled via `form.Subscribe` + `canSubmit`
- [ ] Loading state shown via `isSubmitting`
- [ ] `e.preventDefault()` on form `onSubmit`

### States

- [ ] Empty state with illustration + CTA (Chakra `EmptyState`)
- [ ] Loading state with skeleton (Chakra `Skeleton`)
- [ ] Error state with WHAT/WHY/action (`errorComponent` + `router.invalidate()`)

### Data

- [ ] Server data via TanStack Query (`queryOptions` + `ensureQueryData` + `useSuspenseQuery`)
- [ ] URL state via Router search params (`validateSearch` + `useSearch`)
- [ ] Form state via TanStack Form (`useAppForm` + `form.AppField`)

### Accessibility

- [ ] All elements keyboard navigable
- [ ] Focus indicators visible
- [ ] Touch targets 44px minimum
- [ ] ARIA labels on icon buttons
