import { Effect, Option } from "effect";
import type { Schema } from "effect";
import * as Cause from "effect/Cause";
import type { PersistedQueueError } from "effect/unstable/persistence/PersistedQueue";
import { isSqlError } from "effect/unstable/sql/SqlError";

const pgErrorCode = (cause: unknown): string | undefined => {
  if (typeof cause === "object" && cause !== null && "code" in cause) {
    const c = (cause as { readonly code?: unknown }).code;
    return typeof c === "string" ? c : undefined;
  }
  return undefined;
};

/** Postgres `unique_violation` — duplicate key violates unique constraint */
const POSTGRES_UNIQUE_VIOLATION = "23505" as const;

const isSqlUniqueViolation = (error: unknown): boolean => {
  if (!isSqlError(error)) return false;
  if (error.reason._tag !== "ConstraintError") return false;
  return pgErrorCode(error.reason.cause) === POSTGRES_UNIQUE_VIOLATION;
};

/**
 * `PersistedQueue.offer` wraps SQL failures in `PersistedQueueError` with the
 * original {@link Cause} attached. Unwraps and detects Postgres unique violations
 * (e.g. from partial unique indexes on `effect_queue`).
 */
export const persistedQueueErrorIsPostgresUniqueViolation = (e: PersistedQueueError): boolean => {
  const wrapped = e.cause;
  if (wrapped === undefined) return false;
  const asCause = Cause.isCause(wrapped) ? wrapped : Cause.fail(wrapped);
  const err = Cause.findErrorOption(asCause);
  if (Option.isNone(err)) return false;
  return isSqlUniqueViolation(err.value);
};

/**
 * Treat duplicate pending jobs (Postgres `23505`) as success; rethrow other errors.
 * On duplicate, returns an empty string so {@link PersistedQueue.offer} typing is preserved
 * (callers do not rely on the id).
 */
export const ignoreDuplicatePersistedQueueOffer = (
  self: Effect.Effect<string, PersistedQueueError | Schema.SchemaError, never>,
): Effect.Effect<string, PersistedQueueError | Schema.SchemaError, never> =>
  self.pipe(
    Effect.catchTag("PersistedQueueError", (e) =>
      persistedQueueErrorIsPostgresUniqueViolation(e) ? Effect.succeed("") : Effect.fail(e),
    ),
  );
