import { Effect } from "effect";

import { InboxSyncJobPayload } from "#domain/dtos/inbox-sync-job-payload.ts";
import { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { logAndFailWith } from "#domain/errors/tap-log-and-map-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import { InboxSyncQueue } from "#ports/inbox-sync-queue.port.ts";

export const enqueueInboxSync = Effect.fn("enqueueInboxSync")(
  function* (userId: AuthUserId) {
    const queue = yield* InboxSyncQueue;
    yield* queue.offer(InboxSyncJobPayload.makeUnsafe({ userId }));
  },
  Effect.catchTags({
    SchemaError: logAndFailWith("enqueueInboxSync: SchemaError", InboxSyncError.fromError),
    PersistedQueueError: logAndFailWith(
      "enqueueInboxSync: PersistedQueueError",
      InboxSyncError.fromError,
    ),
  }),
);
