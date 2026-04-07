import { Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { isLabelNotFoundError, LabelNotFoundError } from "#domain/errors/label-not-found-error.ts";
import { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { AuthUserId } from "#domain/models/auth-user.ts";
import { Label, LabelId } from "#domain/models/label.ts";
import type { MessageLabelExampleId } from "#domain/models/message-label-example.ts";
import type { MessageId } from "#domain/models/message.ts";
import type { LabelType } from "#domain/shared/label-type.ts";
import { LabelRepository } from "#ports/label-repository.port.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const LabelIdForUserRequest = Schema.Struct({
    userId: AuthUserId,
    id: LabelId,
  });

  const findLabelByIdForUser = SqlSchema.findOneOption({
    Request: LabelIdForUserRequest,
    Result: Label,
    execute: ({ userId, id }) =>
      sql`SELECT id, user_id, name, prompt, type, is_active, created_at, updated_at FROM labels WHERE id = ${id} AND user_id = ${userId}`,
  });

  const findLabelsByUserId = SqlSchema.findAll({
    Request: AuthUserId,
    Result: Label,
    execute: (userId) =>
      sql`SELECT id, user_id, name, prompt, type, is_active, created_at, updated_at FROM labels WHERE user_id = ${userId} ORDER BY created_at`,
  });

  const findActiveLabelsByUserId = SqlSchema.findAll({
    Request: AuthUserId,
    Result: Label,
    execute: (userId) =>
      sql`SELECT id, user_id, name, prompt, type, is_active, created_at, updated_at FROM labels WHERE user_id = ${userId} AND is_active = true ORDER BY created_at`,
  });

  const findLabelByUserIdAndName = SqlSchema.findOneOption({
    Request: Schema.Struct({ userId: AuthUserId, name: Schema.String }),
    Result: Label,
    execute: (req) =>
      sql`SELECT id, user_id, name, prompt, type, is_active, created_at, updated_at FROM labels WHERE user_id = ${req.userId} AND LOWER(name) = LOWER(${req.name})`,
  });

  const findByIdForUser = Effect.fn("LabelRepository.findByIdForUser")(
    function* (userId: AuthUserId, id: LabelId) {
      return yield* findLabelByIdForUser({ userId, id });
    },
    tapLogAndMapError("LabelRepository.findByIdForUser", LabelPersistenceError.fromError),
  );

  const findByUserId = Effect.fn("LabelRepository.findByUserId")(
    function* (userId: AuthUserId, options?: { readonly activeOnly?: boolean }) {
      return yield* options?.activeOnly
        ? findActiveLabelsByUserId(userId)
        : findLabelsByUserId(userId);
    },
    tapLogAndMapError("LabelRepository.findByUserId", LabelPersistenceError.fromError),
  );

  const findByUserIdAndName = Effect.fn("LabelRepository.findByUserIdAndName")(
    function* (userId: AuthUserId, name: string) {
      return yield* findLabelByUserIdAndName({ userId, name });
    },
    tapLogAndMapError("LabelRepository.findByUserIdAndName", LabelPersistenceError.fromError),
  );

  const createLabel = Effect.fn("LabelRepository.createLabel")(
    function* (input: {
      readonly id: LabelId;
      readonly userId: AuthUserId;
      readonly name: string;
      readonly prompt?: string | undefined;
      readonly type: LabelType;
    }) {
      const now = new Date();
      const rows = yield* sql`INSERT INTO labels ${sql.insert({
        id: input.id,
        userId: input.userId,
        name: input.name,
        prompt: input.prompt ?? null,
        type: input.type,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      })} RETURNING id, user_id, name, prompt, type, is_active, created_at, updated_at`;
      return yield* Schema.decodeUnknownEffect(Label)(rows[0]);
    },
    tapLogAndMapError("LabelRepository.createLabel", LabelPersistenceError.fromError),
  );

  const update = Effect.fn("LabelRepository.update")(
    function* (userId: AuthUserId, id: LabelId, input: { readonly isActive: boolean }) {
      const now = new Date();
      const fields: Record<string, unknown> = { updatedAt: now, isActive: input.isActive };

      const rows = yield* sql`UPDATE labels SET ${sql.update(
        fields,
      )} WHERE id = ${id} AND user_id = ${userId} RETURNING id, user_id, name, prompt, type, is_active, created_at, updated_at`;

      if (rows.length === 0) {
        return yield* Effect.fail(new LabelNotFoundError());
      }

      return yield* Schema.decodeUnknownEffect(Label)(rows[0]);
    },
    (eff) =>
      eff.pipe(
        Effect.tapError((cause) => Effect.logError("[LabelRepository.update]", cause)),
        Effect.mapError((e: unknown) =>
          isLabelNotFoundError(e) ? e : LabelPersistenceError.fromError(e),
        ),
      ),
  );

  const create = Effect.fn("LabelRepository.create")(
    function* (input: {
      readonly id: LabelId;
      readonly userId: AuthUserId;
      readonly name: string;
      readonly prompt?: string | undefined;
      readonly type: LabelType;
      readonly examples?: ReadonlyArray<{
        readonly id: MessageLabelExampleId;
        readonly messageId: MessageId;
      }>;
    }) {
      const examples = input.examples ?? [];
      return yield* sql.withTransaction(
        Effect.gen(function* () {
          const label = yield* createLabel(input);

          if (examples.length > 0) {
            const now = new Date();
            const rows = examples.map((ex) => ({
              id: ex.id,
              labelId: input.id,
              messageId: ex.messageId,
              createdAt: now,
            }));
            yield* sql`INSERT INTO message_label_examples ${sql.insert(rows)}`;
          }

          return label;
        }),
      );
    },
    tapLogAndMapError("LabelRepository.create", LabelPersistenceError.fromError),
  );

  return LabelRepository.of({
    findByIdForUser,
    findByUserId,
    findByUserIdAndName,
    create,
    update,
  });
});

export const LabelRepositoryLive = Layer.effect(LabelRepository, make);
