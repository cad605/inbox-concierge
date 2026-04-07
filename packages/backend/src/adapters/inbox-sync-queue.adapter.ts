import { Effect, Layer } from "effect";
import { PersistedQueue } from "effect/unstable/persistence";

import { InboxSyncJobPayload } from "#domain/dtos/inbox-sync-job-payload.ts";
import { USER_INBOX_SYNC_QUEUE_NAME } from "#domain/shared/persisted-queue-constants.ts";
import { ignoreDuplicatePersistedQueueOffer } from "#lib/persisted-queue-offer-dedupe.ts";
import { InboxSyncQueue } from "#ports/inbox-sync-queue.port.ts";

export const InboxSyncQueueLive = Layer.effect(
  InboxSyncQueue,
  Effect.gen(function* () {
    const queue = yield* PersistedQueue.make({
      name: USER_INBOX_SYNC_QUEUE_NAME,
      schema: InboxSyncJobPayload,
    });
    return InboxSyncQueue.of({
      ...queue,
      offer: (value, options) => ignoreDuplicatePersistedQueueOffer(queue.offer(value, options)),
    });
  }),
);
