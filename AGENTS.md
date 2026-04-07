# Information

- The base branch for this repository is `main`.
- The package manager used is `bun`.

# Validations

After making changes, run `bun quality:check` to run all validations. This will check
for linting errors, formatting issues, and type errors.

Individual checks can be run separately:

- `bun typecheck` - type check all packages
- `bun lint:check` - lint all packages (oxlint)
- `bun format:check` - check formatting (oxfmt)
- `bun test` - run tests across all packages

Workspace-scoped scripts follow the `{package}:{script}` pattern (e.g.
`bun backend:start`, `bun backend:dev`, `bun web:dev`, `bun backend:test`,
`bun backend:typecheck`, `bun http:openapi:types`).

# Learning more about the "effect" & other packages

`.repos/effect/LLMS.md` is an authoritative source of information about the
"effect" and "@effect/\*" packages for V4. Read this before looking elsewhere for information about these packages. It contains the best practices for using Effect V4.

`.repos/chakra-ui` contains best practices using Chakra UI components. Consult it.

Use these for learning more about the library, rather than browsing the code in
`node_modules/`.

## Implementation Guidelines

### Backend (packages/backend, http)

**Effect-based** - functional, type-safe, composable.

**Read these specs:**

- [specs/guides/effect-guide.md](specs/guides/effect-guide.md) - critical rules for Effect code, layers, SQL, testing
- [specs/guides/api-guide.md](specs/guides/api-guide.md) - API layer conventions

**Guidelines:**

1. **Flat modules, no barrel files** - `create-user.ts` not `ports/create-user/index.ts`
2. **Prefer Schema.Class over Schema.Struct, and Model.Class over Schema.Class for database backed** - classes give you constructor, Equal, Hash
3. **Use Schema's `.makeUnsafe()` constructor** - all schemas have it, never use `new`
4. **Use `Schema.TaggedErrorClass`** for domain errors with `{ httpApiStatus }` for HTTP mapping; export type guards via `Schema.is()`
5. **Use branded types** for IDs (AccountId, CompanyId, etc.)
6. **Use Layer.effect or Layer.scoped** - avoid Layer.succeed and Tag.of
7. **ALWAYS use precise domain schemas** - if a field can be `UserRole` or `Schema.String`, ALWAYS use `UserRole`. Never lose type precision by using primitives when a richer domain type exists. This applies to all schemas - domain entities, API requests/responses, and intermediate data structures.

### Frontend (packages/web)

**React** with TanStack ecosystem and Chakra UI. **No Effect _runtime_ in frontend** (no `Effect.gen`, services, or pipelines in React components or routes).

**Exception — TanStack DB collection rows:** Use **Effect `Schema`** and **`Schema.toStandardSchemaV1`** only in `packages/web/src/infrastructure/collections/*.ts` for the `schema` option on **Query Collection** (`@tanstack/query-db-collection` / `queryCollectionOptions`). See [specs/guides/frontend-guide.md](specs/guides/frontend-guide.md).

**Read this spec:**

- [specs/guides/frontend-guide.md](specs/guides/frontend-guide.md) - routing, data fetching, forms, components, UX patterns

**Guidelines:**

1. **TanStack Router** for file-based routing — types are fully inferred, never annotate
2. **TanStack Query** for server state — use `queryOptions` factories, `ensureQueryData` in loaders, `useSuspenseQuery` in components
3. **TanStack Form** for form state — use `createFormHook` pattern with pre-bound field components, Zod for validation
4. **TanStack DB** for reactive client state — use the **Query Collection** adapter (`queryCollectionOptions`); collections are client-side only; `preload()` in loaders and `useLiveQuery` in components; `ssr: false` on routes that use collections (required for SSR-capable stacks; see frontend guide for Vite-only nuance)
5. **Chakra UI** for all UI components — use component library instead of raw HTML/CSS, consult `user-chakra-ui` MCP server
6. **Never fetch in useEffect** — use route loaders with TanStack Query
7. **Search params for shareable state** — use `validateSearch` with Zod schemas
8. **Auth guards in `beforeLoad`** — not in components, to prevent flash of protected content

# Learning more about the frontend libraries

`.repos/tanstack-router` contains skills and best practices for TanStack Router.
Key paths:

- `packages/react-router/skills/react-router/SKILL.md` — React bindings, hooks, components
- `packages/react-start/skills/react-start/SKILL.md` — TanStack Start (SSR framework)
- `packages/router-core/skills/router-core/` — sub-skills for data loading, search params, navigation, auth, errors
- `packages/react-router/skills/compositions/router-query/SKILL.md` — Router + Query integration

`.repos/tanstack-query` contains examples for TanStack Query in `examples/react/`.

`.repos/tanstack-form` contains docs and guides for TanStack Form.
Key paths:

- `docs/framework/react/guides/` — basic concepts, validation, form composition, arrays, listeners
- `docs/framework/react/quick-start.md` — quick start with `createFormHook`

`.repos/tanstack-db` contains skills for TanStack DB.
Key paths:

- `packages/db/skills/db-core/SKILL.md` — core concepts and sub-skill index
- `packages/react-db/skills/react-db/SKILL.md` — React hooks (useLiveQuery, useLiveSuspenseQuery)
- `packages/db/skills/db-core/collection-setup/SKILL.md` — collection creation and adapters
- `packages/db/skills/db-core/mutations-optimistic/SKILL.md` — mutation patterns
- `packages/db/skills/meta-framework/SKILL.md` — preloading in route loaders

Use these for learning more about the library, rather than browsing the code in
`node_modules/`.
