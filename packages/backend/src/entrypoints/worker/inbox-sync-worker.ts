import { Effect, Layer } from "effect";

import { PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS } from "#domain/shared/persisted-queue-constants.ts";
import { InboxSyncQueue } from "#ports/inbox-sync-queue.port.ts";
import { syncUserThreads } from "#use-cases/sync-user-threads.use-case.ts";

export const InboxSyncWorkerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const queue = yield* InboxSyncQueue;

    yield* Effect.gen(function* () {
      while (true) {
        yield* queue.take(
          Effect.fn("InboxSyncWorker.processJob")(function* (payload, _metadata) {
            yield* syncUserThreads(payload.userId);
          }),
          { maxAttempts: PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS },
        );
      }
    }).pipe(
      Effect.onInterrupt(() => Effect.logInfo("Inbox sync worker shutting down")),
      Effect.forkScoped,
    );
  }),
);
