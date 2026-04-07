import { Effect, Option } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { MessageId } from "#domain/models/message.ts";
import { LabelRepository } from "#ports/label-repository.port.ts";
import { MessageAutoLabeler } from "#ports/message-auto-labeler.port.ts";
import { MessageLabelExampleRepository } from "#ports/message-label-example-repository.port.ts";
import { MessageLabelRepository } from "#ports/message-label-repository.port.ts";
import { ThreadRepository } from "#ports/thread-repository.port.ts";

export const autoLabelMessage = Effect.fn("autoLabelMessage")(function* (
  userId: AuthUserId,
  messageId: MessageId,
  jobId: string,
) {
  const labelRepo = yield* LabelRepository;
  const exampleRepo = yield* MessageLabelExampleRepository;
  const threadRepo = yield* ThreadRepository;
  const autoLabeler = yield* MessageAutoLabeler;
  const messageLabelRepo = yield* MessageLabelRepository;

  const activeLabels = yield* labelRepo.findByUserId(userId, { activeOnly: true });

  if (activeLabels.length === 0) return;

  const messageOpt = yield* threadRepo.findMessageContentByUserAndMessageId(userId, messageId);
  if (Option.isNone(messageOpt)) return;

  const allExamples = yield* exampleRepo.findByLabelIds(activeLabels.map(({ id }) => id));

  const labelByName = new Map(activeLabels.map((l) => [l.name.toLowerCase(), l]));

  const result = yield* autoLabeler.autoLabelMessage({
    message: messageOpt.value,
    labels: activeLabels,
    examples: allExamples,
  });

  const upserts = result.labelNames.flatMap((name) => {
    const lbl = labelByName.get(name.toLowerCase());
    return lbl !== undefined ? [{ messageId: result.messageId, labelId: lbl.id, jobId }] : [];
  });

  if (upserts.length > 0) {
    yield* messageLabelRepo.upsertMany(upserts);
  }
});
