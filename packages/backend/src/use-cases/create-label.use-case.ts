import { Effect, Option } from "effect";

import { AutoLabelJobPayload } from "#domain/dtos/auto-label-job-payload.ts";
import { LabelAlreadyExistsError } from "#domain/errors/label-already-exists-error.ts";
import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import { logAndFailWith } from "#domain/errors/tap-log-and-map-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import { LabelId } from "#domain/models/label.ts";
import { MessageLabelExampleId } from "#domain/models/message-label-example.ts";
import type { MessageId } from "#domain/models/message.ts";
import type { LabelType } from "#domain/shared/label-type.ts";
import { generateId } from "#lib/uuid.ts";
import { AutoLabelQueue } from "#ports/auto-label-queue.port.ts";
import { CheckPermission } from "#ports/check-permission.port.ts";
import { LabelRepository } from "#ports/label-repository.port.ts";
import { ThreadRepository } from "#ports/thread-repository.port.ts";

export const createLabel = Effect.fn("createLabel")(
  function* (input: {
    readonly userId: AuthUserId;
    readonly name: string;
    readonly prompt?: string | undefined;
    readonly type: LabelType;
    readonly examples?: ReadonlyArray<MessageId> | undefined;
  }) {
    const checkPermission = yield* CheckPermission;
    const labelRepo = yield* LabelRepository;
    const threadRepo = yield* ThreadRepository;
    const queue = yield* AutoLabelQueue;

    const existing = yield* labelRepo.findByUserIdAndName(input.userId, input.name);
    if (Option.isSome(existing)) {
      return yield* Effect.fail(new LabelAlreadyExistsError({ name: input.name }));
    }

    const labelId = LabelId.makeUnsafe(generateId());

    const examples = (input.examples ?? []).map((messageId) => ({
      id: MessageLabelExampleId.makeUnsafe(generateId()),
      messageId,
    }));

    for (const messageId of input.examples ?? []) {
      yield* checkPermission({
        actorId: input.userId,
        action: "read",
        resource: "message",
        resourceId: messageId,
      });
    }

    const label = yield* labelRepo.create({
      id: labelId,
      userId: input.userId,
      name: input.name,
      prompt: input.prompt,
      type: input.type,
      examples,
    });

    const messageIds = yield* threadRepo.findMessageIdsForAutoLabelByUserId(input.userId);
    yield* Effect.forEach(
      messageIds,
      (messageId) =>
        queue.offer(AutoLabelJobPayload.makeUnsafe({ userId: input.userId, messageId })),
      { concurrency: 16 },
    );

    return label;
  },
  Effect.catchTags({
    SchemaError: logAndFailWith("createLabel: SchemaError", LabelPersistenceError.fromError),
    PersistedQueueError: logAndFailWith(
      "createLabel: PersistedQueueError",
      LabelPersistenceError.fromError,
    ),
  }),
);
