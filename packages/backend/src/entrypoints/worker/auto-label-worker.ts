import { Config, Effect, Layer } from "effect";

import { PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS } from "#domain/shared/persisted-queue-constants.ts";
import { AutoLabelQueue } from "#ports/auto-label-queue.port.ts";
import { autoLabelMessage } from "#use-cases/auto-label-message.use-case.ts";

export const AutoLabelWorkerLive = Layer.effectDiscard(
  Effect.gen(function* () {
    const concurrency = yield* Config.number("AUTO_LABEL_CONSUMER_CONCURRENCY").pipe(
      Config.withDefault(3),
    );
    const queue = yield* AutoLabelQueue;

    yield* Effect.forEach(
      Array.from({ length: concurrency }, (_, i) => i),
      (workerIndex) =>
        Effect.gen(function* () {
          while (true) {
            yield* queue.take(
              Effect.fn("AutoLabelWorker.processJob")(function* (payload, metadata) {
                yield* autoLabelMessage(payload.userId, payload.messageId, metadata.id);
              }),
              { maxAttempts: PERSISTED_QUEUE_WORKER_MAX_ATTEMPTS },
            );
          }
        }).pipe(
          Effect.onInterrupt(() =>
            Effect.logInfo(`Auto-label worker consumer ${workerIndex} shutting down`),
          ),
          Effect.forkScoped,
        ),
      { discard: true },
    );
  }),
);
