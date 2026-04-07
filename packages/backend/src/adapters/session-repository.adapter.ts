import { DateTime, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import { AuthSessionId, Session } from "#domain/models/session.ts";
import type { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import type { UserAgent } from "#domain/shared/user-agent.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findSessionById = SqlSchema.findOneOption({
    Request: AuthSessionId,
    Result: Session,
    execute: (id) =>
      sql`SELECT id, user_id, provider, expires_at, created_at, user_agent, ip_address FROM auth_sessions WHERE id = ${id}`,
  });

  const deleteSessionById = SqlSchema.void({
    Request: AuthSessionId,
    execute: (id) => sql`DELETE FROM auth_sessions WHERE id = ${id}`,
  });

  const findById = Effect.fn("SessionRepository.findById")(
    function* (id: AuthSessionId) {
      return yield* findSessionById(id);
    },
    tapLogAndMapError("SessionRepository.findById", AuthPersistenceError.fromError),
  );

  const create = Effect.fn("SessionRepository.create")(
    function* (input: {
      readonly id: AuthSessionId;
      readonly userId: AuthUserId;
      readonly provider: AuthProviderType;
      readonly expiresAt: DateTime.Utc;
      readonly userAgent: Option.Option<UserAgent>;
      readonly ipAddress: Option.Option<string>;
    }) {
      const rows = yield* sql`INSERT INTO auth_sessions ${sql.insert({
        id: input.id,
        userId: input.userId,
        provider: input.provider,
        expiresAt: DateTime.toDateUtc(input.expiresAt),
        createdAt: new Date(),
        userAgent: Option.getOrNull(input.userAgent),
        ipAddress: Option.getOrNull(input.ipAddress),
      })} RETURNING id, user_id, provider, expires_at, created_at, user_agent, ip_address`;
      return yield* Schema.decodeUnknownEffect(Session)(rows[0]);
    },
    tapLogAndMapError("SessionRepository.create", AuthPersistenceError.fromError),
  );

  const deleteSession = Effect.fn("SessionRepository.delete")(
    function* (id: AuthSessionId) {
      yield* deleteSessionById(id);
    },
    tapLogAndMapError("SessionRepository.delete", AuthPersistenceError.fromError),
  );

  return SessionRepository.of({
    findById,
    create,
    delete: deleteSession,
  });
});

export const SessionRepositoryLive = Layer.effect(SessionRepository, make);
