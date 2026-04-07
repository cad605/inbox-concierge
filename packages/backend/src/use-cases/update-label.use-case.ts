import { Effect, Option } from "effect";

import { AutoLabelJobPayload } from "#domain/dtos/auto-label-job-payload.ts";
import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import { logAndFailWith } from "#domain/errors/tap-log-and-map-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { LabelId } from "#domain/models/label.ts";
import { AutoLabelQueue } from "#ports/auto-label-queue.port.ts";
import { CheckPermission } from "#ports/check-permission.port.ts";
import { LabelRepository } from "#ports/label-repository.port.ts";
import { ThreadRepository } from "#ports/thread-repository.port.ts";

export const updateLabel = Effect.fn("updateLabel")(
  function* (userId: AuthUserId, id: LabelId, input: { readonly isActive: boolean }) {
    const checkPermission = yield* CheckPermission;
    const labelRepo = yield* LabelRepository;
    const threadRepo = yield* ThreadRepository;
    const queue = yield* AutoLabelQueue;

    yield* checkPermission({
      actorId: userId,
      action: "write",
      resource: "label",
      resourceId: id,
    });

    const before = yield* labelRepo.findByIdForUser(userId, id);
    if (Option.isNone(before)) {
      return yield* labelRepo.update(userId, id, input);
    }

    const updated = yield* labelRepo.update(userId, id, input);

    if (before.value.isActive !== input.isActive) {
      const messageIds = yield* threadRepo.findMessageIdsForAutoLabelByUserId(updated.userId);
      yield* Effect.forEach(
        messageIds,
        (messageId) =>
          queue.offer(AutoLabelJobPayload.makeUnsafe({ userId: updated.userId, messageId })),
        { concurrency: 16 },
      );
    }

    return updated;
  },
  Effect.catchTags({
    SchemaError: logAndFailWith("updateLabel: SchemaError", LabelPersistenceError.fromError),
    PersistedQueueError: logAndFailWith(
      "updateLabel: PersistedQueueError",
      LabelPersistenceError.fromError,
    ),
  }),
);
