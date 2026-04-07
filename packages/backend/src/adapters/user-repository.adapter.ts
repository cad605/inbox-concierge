import { Effect, Layer, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { AuthUser, AuthUserId } from "#domain/models/auth-user.ts";
import type { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import { Email } from "#domain/shared/email.ts";
import type { UserRole } from "#domain/shared/user-role.ts";
import { UserRepository } from "#ports/user-repository.port.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findUserById = SqlSchema.findOneOption({
    Request: AuthUserId,
    Result: AuthUser,
    execute: (id) =>
      sql`SELECT id, email, display_name, role, primary_provider, created_at, updated_at FROM auth_users WHERE id = ${id}`,
  });

  const findUserByEmail = SqlSchema.findOneOption({
    Request: Email,
    Result: AuthUser,
    execute: (email) =>
      sql`SELECT id, email, display_name, role, primary_provider, created_at, updated_at FROM auth_users WHERE LOWER(email) = LOWER(${email})`,
  });

  const findById = Effect.fn("UserRepository.findById")(
    function* (id: AuthUserId) {
      return yield* findUserById(id);
    },
    tapLogAndMapError("UserRepository.findById", AuthPersistenceError.fromError),
  );

  const findByEmail = Effect.fn("UserRepository.findByEmail")(
    function* (email: Email) {
      return yield* findUserByEmail(email);
    },
    tapLogAndMapError("UserRepository.findByEmail", AuthPersistenceError.fromError),
  );

  const create = Effect.fn("UserRepository.create")(
    function* (input: {
      readonly id: AuthUserId;
      readonly email: Email;
      readonly displayName: string;
      readonly role: UserRole;
      readonly primaryProvider: AuthProviderType;
    }) {
      const now = new Date();
      const rows = yield* sql`INSERT INTO auth_users ${sql.insert({
        id: input.id,
        email: input.email,
        displayName: input.displayName,
        role: input.role,
        primaryProvider: input.primaryProvider,
        createdAt: now,
        updatedAt: now,
      })} RETURNING id, email, display_name, role, primary_provider, created_at, updated_at`;
      return yield* Schema.decodeUnknownEffect(AuthUser)(rows[0]);
    },
    tapLogAndMapError("UserRepository.create", AuthPersistenceError.fromError),
  );

  return UserRepository.of({ findById, findByEmail, create });
});

export const UserRepositoryLive = Layer.effect(UserRepository, make);
