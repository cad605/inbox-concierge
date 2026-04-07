import { Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { LabelId } from "#domain/models/label.ts";
import { MessageLabelExample } from "#domain/models/message-label-example.ts";
import { MessageLabelExampleRepository } from "#ports/message-label-example-repository.port.ts";

const LabelIdsRequest = Schema.Struct({
  labelIds: Schema.Array(LabelId),
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findExamplesByLabelId = SqlSchema.findAll({
    Request: LabelId,
    Result: MessageLabelExample,
    execute: (labelId) =>
      sql`SELECT id, label_id, message_id, created_at FROM message_label_examples WHERE label_id = ${labelId}`,
  });

  const findExamplesByLabelIds = SqlSchema.findAll({
    Request: LabelIdsRequest,
    Result: MessageLabelExample,
    execute: ({ labelIds }) =>
      labelIds.length === 0
        ? sql`SELECT id, label_id, message_id, created_at FROM message_label_examples WHERE false`
        : sql`SELECT id, label_id, message_id, created_at FROM message_label_examples WHERE label_id = ANY(${labelIds})`,
  });

  const findByLabelId = Effect.fn("MessageLabelExampleRepository.findByLabelId")(
    function* (labelId: LabelId) {
      return yield* findExamplesByLabelId(labelId);
    },
    tapLogAndMapError(
      "MessageLabelExampleRepository.findByLabelId",
      LabelPersistenceError.fromError,
    ),
  );

  const findByLabelIds = Effect.fn("MessageLabelExampleRepository.findByLabelIds")(
    function* (labelIds: ReadonlyArray<LabelId>) {
      return yield* findExamplesByLabelIds({ labelIds: [...labelIds] });
    },
    tapLogAndMapError(
      "MessageLabelExampleRepository.findByLabelIds",
      LabelPersistenceError.fromError,
    ),
  );

  return MessageLabelExampleRepository.of({
    findByLabelId,
    findByLabelIds,
  });
});

export const MessageLabelExampleRepositoryLive = Layer.effect(MessageLabelExampleRepository, make);
