import { describe, expect, it } from "@effect/vitest";
import { Cause, Effect, Exit } from "effect";
import { PersistedQueueError } from "effect/unstable/persistence/PersistedQueue";
import { ConstraintError, SqlError, UnknownError } from "effect/unstable/sql/SqlError";

import {
  ignoreDuplicatePersistedQueueOffer,
  persistedQueueErrorIsPostgresUniqueViolation,
} from "#lib/persisted-queue-offer-dedupe.ts";

const sqlUniqueViolation = (): SqlError => {
  const inner = new ConstraintError({ cause: { code: "23505", message: "duplicate key" } });
  return new SqlError({ reason: inner });
};

const sqlOtherConstraint = (): SqlError => {
  const inner = new ConstraintError({ cause: { code: "23503", message: "fk violation" } });
  return new SqlError({ reason: inner });
};

const persistedQueueErrorWithSql = (sql: SqlError, message = "offer failed"): PersistedQueueError =>
  new PersistedQueueError({ message, cause: Cause.fail(sql) });

describe("persistedQueueErrorIsPostgresUniqueViolation", () => {
  it("is true when cause wraps Postgres unique_violation 23505", () => {
    const e = persistedQueueErrorWithSql(sqlUniqueViolation());
    expect(persistedQueueErrorIsPostgresUniqueViolation(e)).toBe(true);
  });

  it("is false for other constraint SQL states", () => {
    const e = persistedQueueErrorWithSql(sqlOtherConstraint());
    expect(persistedQueueErrorIsPostgresUniqueViolation(e)).toBe(false);
  });

  it("is false when cause is not SqlError", () => {
    const e = new PersistedQueueError({ message: "x", cause: Cause.fail(new Error("plain")) });
    expect(persistedQueueErrorIsPostgresUniqueViolation(e)).toBe(false);
  });

  it("is false for SqlError that is not a constraint failure", () => {
    const sql = new SqlError({
      reason: new UnknownError({ message: "syntax error", cause: new Error("x") }),
    });
    expect(persistedQueueErrorIsPostgresUniqueViolation(persistedQueueErrorWithSql(sql))).toBe(
      false,
    );
  });
});

describe("ignoreDuplicatePersistedQueueOffer", () => {
  it.effect("succeeds with empty string on unique violation", () =>
    Effect.gen(function* () {
      const offer = Effect.fail(persistedQueueErrorWithSql(sqlUniqueViolation()));
      const result = yield* ignoreDuplicatePersistedQueueOffer(offer);
      expect(result).toBe("");
    }),
  );

  it.effect("rethrows PersistedQueueError when not a unique violation", () =>
    Effect.gen(function* () {
      const pqe = persistedQueueErrorWithSql(sqlOtherConstraint());
      const offer = Effect.fail(pqe);
      const exit = yield* Effect.exit(ignoreDuplicatePersistedQueueOffer(offer));
      expect(exit).toStrictEqual(Exit.fail(pqe));
    }),
  );
});
