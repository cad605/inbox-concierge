import { Schema } from "effect";
import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi";

import { InboxThreadListPage } from "#domain/dtos/inbox-thread-list-page.ts";
import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { InboxNotConnectedError } from "#domain/errors/inbox-not-connected-error.ts";
import { InboxPersistenceError } from "#domain/errors/inbox-persistence-error.ts";
import { InboxReauthorizationRequiredError } from "#domain/errors/inbox-reauthorization-required-error.ts";
import { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { Authorization } from "#entrypoints/http/middleware/auth.middleware.ts";

const threadListLimit = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isGreaterThan(0)),
  Schema.check(Schema.isLessThanOrEqualTo(500)),
);

const threadListOffset = Schema.NumberFromString.pipe(
  Schema.check(Schema.isInt()),
  Schema.check(Schema.isGreaterThanOrEqualTo(0)),
);

const list = HttpApiEndpoint.get("listThreads", "/", {
  query: {
    limit: Schema.optional(threadListLimit),
    offset: Schema.optional(threadListOffset),
  },
  success: InboxThreadListPage,
  error: [InboxPersistenceError],
});

const sync = HttpApiEndpoint.post("syncThreads", "/sync", {
  success: HttpApiSchema.NoContent,
  error: [
    InboxNotConnectedError,
    InboxReauthorizationRequiredError,
    InboxSyncError,
    InboxPersistenceError,
    AuthPersistenceError,
  ],
});

export class ThreadApi extends HttpApiGroup.make("threads")
  .add(list, sync)
  .prefix("/api/threads")
  .middleware(Authorization)
  .annotateMerge(
    OpenApi.annotations({
      title: "Threads",
      description: "Thread inbox and sync endpoints",
    }),
  ) {}
