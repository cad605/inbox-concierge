import { Effect, Layer } from "effect";
import { PersistedQueue } from "effect/unstable/persistence";

import { AutoLabelJobPayload } from "#domain/dtos/auto-label-job-payload.ts";
import { MESSAGE_AUTO_LABEL_QUEUE_NAME } from "#domain/shared/persisted-queue-constants.ts";
import { ignoreDuplicatePersistedQueueOffer } from "#lib/persisted-queue-offer-dedupe.ts";
import { AutoLabelQueue } from "#ports/auto-label-queue.port.ts";

export const AutoLabelQueueLive = Layer.effect(
  AutoLabelQueue,
  Effect.gen(function* () {
    const queue = yield* PersistedQueue.make({
      name: MESSAGE_AUTO_LABEL_QUEUE_NAME,
      schema: AutoLabelJobPayload,
    });
    return AutoLabelQueue.of({
      ...queue,
      offer: (value, options) => ignoreDuplicatePersistedQueueOffer(queue.offer(value, options)),
    });
  }),
);
