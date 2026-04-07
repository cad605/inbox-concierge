import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import type { LabelId } from "#domain/models/label.ts";
import type { MessageId } from "#domain/models/message.ts";
import { MessageLabelRepository } from "#ports/message-label-repository.port.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const upsertMany = Effect.fn("MessageLabelRepository.upsertMany")(
    function* (
      inputs: ReadonlyArray<{
        readonly messageId: MessageId;
        readonly labelId: LabelId;
        readonly jobId: string;
      }>,
    ) {
      if (inputs.length === 0) return;
      const now = new Date();
      const rows = inputs.map((input) => ({
        messageId: input.messageId,
        labelId: input.labelId,
        jobId: input.jobId,
        classifiedAt: now,
      }));
      yield* sql`
      INSERT INTO message_labels ${sql.insert(rows)}
      ON CONFLICT (message_id, label_id, job_id)
      DO UPDATE SET classified_at = EXCLUDED.classified_at
    `;
    },
    tapLogAndMapError("MessageLabelRepository.upsertMany", LabelPersistenceError.fromError),
  );

  return MessageLabelRepository.of({
    upsertMany,
  });
});

export const MessageLabelRepositoryLive = Layer.effect(MessageLabelRepository, make);
