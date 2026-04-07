import { Effect, Layer, Match } from "effect";
import { SqlClient } from "effect/unstable/sql";

import { makeDatabaseUnavailableError } from "#domain/errors/database-unavailable-error.ts";
import { PermissionDeniedError } from "#domain/errors/permission-denied-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { LabelId } from "#domain/models/label.ts";
import type { MessageId } from "#domain/models/message.ts";
import type { ThreadId } from "#domain/models/thread.ts";
import { CheckPermission, type BaseCheck } from "#ports/check-permission.port.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const checkLabelOwnership = Effect.fn("CheckPermission.checkLabelOwnership")(function* (
    check: BaseCheck<"label", LabelId>,
  ) {
    const result = yield* sql`
        SELECT id FROM labels
        WHERE id = ${check.resourceId} AND user_id = ${check.actorId}
        LIMIT 1
      `;
    if (result.length === 0) return yield* new PermissionDeniedError();
  }, Effect.asVoid);

  const checkMessageOwnership = Effect.fn("CheckPermission.checkMessageOwnership")(function* (
    check: BaseCheck<"message", MessageId>,
  ) {
    const result = yield* sql`
        SELECT m.id FROM messages m
        JOIN threads t ON t.id = m.thread_id
        WHERE m.id = ${check.resourceId} AND t.user_id = ${check.actorId}
        LIMIT 1
      `;
    if (result.length === 0) return yield* new PermissionDeniedError();
  }, Effect.asVoid);

  const checkThreadOwnership = Effect.fn("CheckPermission.checkThreadOwnership")(function* (
    check: BaseCheck<"thread", ThreadId>,
  ) {
    const result = yield* sql`
        SELECT id FROM threads
        WHERE id = ${check.resourceId} AND user_id = ${check.actorId}
        LIMIT 1
      `;
    if (result.length === 0) return yield* new PermissionDeniedError();
  }, Effect.asVoid);

  const checkPendingJobsRead = Effect.fn("CheckPermission.checkPendingJobsRead")(function* (
    check: BaseCheck<"pendingJobs", AuthUserId>,
  ) {
    if (check.action !== "read") return yield* new PermissionDeniedError();
    if (check.actorId !== check.resourceId) return yield* new PermissionDeniedError();
  }, Effect.asVoid);

  return CheckPermission.of((check) => {
    return Match.value(check.resource)
      .pipe(
        Match.when("label", () => checkLabelOwnership(check as BaseCheck<"label", LabelId>)),
        Match.when("message", () =>
          checkMessageOwnership(check as BaseCheck<"message", MessageId>),
        ),
        Match.when("pendingJobs", () =>
          checkPendingJobsRead(check as BaseCheck<"pendingJobs", AuthUserId>),
        ),
        Match.when("thread", () => checkThreadOwnership(check as BaseCheck<"thread", ThreadId>)),
        Match.exhaustive,
      )
      .pipe(
        Effect.catchTag("SqlError", (e) =>
          Effect.gen(function* () {
            yield* Effect.logError("CheckPermission: SQL failure", e);
            yield* Effect.fail(makeDatabaseUnavailableError());
          }),
        ),
      );
  });
});

export const CheckPermissionLive = Layer.effect(CheckPermission, make);
