import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

import { PendingPersistedJobCounts } from "#domain/dtos/pending-persisted-job-counts.ts";
import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { DatabaseUnavailableError } from "#domain/errors/database-unavailable-error.ts";
import { PermissionDeniedError } from "#domain/errors/permission-denied-error.ts";
import { SessionNotFoundError } from "#domain/errors/session-not-found-error.ts";
import { AuthUser } from "#domain/models/auth-user.ts";
import { Authorization } from "#entrypoints/http/middleware/auth.middleware.ts";

const me = HttpApiEndpoint.get("me", "/me", {
  success: AuthUser,
});

const logoutEndpoint = HttpApiEndpoint.post("logout", "/logout", {
  success: HttpApiSchema.NoContent,
  error: [SessionNotFoundError, AuthPersistenceError],
});

const refresh = HttpApiEndpoint.post("refresh", "/refresh", {
  success: Schema.Struct({ user: AuthUser }),
  error: [AuthPersistenceError],
});

const pendingJobs = HttpApiEndpoint.get("pendingJobs", "/pending-jobs", {
  success: PendingPersistedJobCounts,
  error: [DatabaseUnavailableError, PermissionDeniedError],
});

export class AuthSessionApi extends HttpApiGroup.make("authSession")
  .add(me, logoutEndpoint, refresh, pendingJobs)
  .prefix("/api/auth")
  .middleware(Authorization)
  .annotateMerge(
    OpenApi.annotations({
      title: "Auth Session",
      description: "Protected authentication endpoints",
    }),
  ) {}
