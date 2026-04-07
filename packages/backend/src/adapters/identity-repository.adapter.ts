import { Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { type AuthIdentityId, AuthIdentity } from "#domain/models/auth-identity.ts";
import { AuthUserId } from "#domain/models/auth-user.ts";
import { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import { ProviderId } from "#domain/shared/provider-id.ts";
import { IdentityRepository } from "#ports/identity-repository.port.ts";

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const findIdentityByProvider = SqlSchema.findOneOption({
    Request: Schema.Struct({ provider: AuthProviderType, providerId: ProviderId }),
    Result: AuthIdentity,
    execute: (req) =>
      sql`SELECT id, user_id, provider, provider_id, provider_data, created_at FROM auth_identities WHERE provider = ${req.provider} AND provider_id = ${req.providerId}`,
  });

  const findIdentityByUserIdAndProvider = SqlSchema.findOneOption({
    Request: Schema.Struct({ userId: AuthUserId, provider: AuthProviderType }),
    Result: AuthIdentity,
    execute: (req) =>
      sql`SELECT id, user_id, provider, provider_id, provider_data, created_at FROM auth_identities WHERE user_id = ${req.userId} AND provider = ${req.provider}`,
  });

  const findByProvider = Effect.fn("IdentityRepository.findByProvider")(
    function* (provider: AuthProviderType, providerId: ProviderId) {
      return yield* findIdentityByProvider({ provider, providerId });
    },
    tapLogAndMapError("IdentityRepository.findByProvider", AuthPersistenceError.fromError),
  );

  const findByUserIdAndProvider = Effect.fn("IdentityRepository.findByUserIdAndProvider")(
    function* (userId: AuthUserId, provider: AuthProviderType) {
      return yield* findIdentityByUserIdAndProvider({ userId, provider });
    },
    tapLogAndMapError("IdentityRepository.findByUserIdAndProvider", AuthPersistenceError.fromError),
  );

  const create = Effect.fn("IdentityRepository.create")(
    function* (input: {
      readonly id: AuthIdentityId;
      readonly userId: AuthUserId;
      readonly provider: AuthProviderType;
      readonly providerId: ProviderId;
      readonly providerData: Option.Option<unknown>;
    }) {
      const providerDataJson = Option.match(input.providerData, {
        onNone: () => null,
        onSome: (data) => JSON.stringify(data),
      });
      const rows = yield* sql`INSERT INTO auth_identities ${sql.insert({
        id: input.id,
        userId: input.userId,
        provider: input.provider,
        providerId: input.providerId,
        providerData: providerDataJson,
        createdAt: new Date(),
      })} RETURNING id, user_id, provider, provider_id, provider_data, created_at`;
      return yield* Schema.decodeUnknownEffect(AuthIdentity)(rows[0]);
    },
    tapLogAndMapError("IdentityRepository.create", AuthPersistenceError.fromError),
  );

  return IdentityRepository.of({ findByProvider, findByUserIdAndProvider, create });
});

export const IdentityRepositoryLive = Layer.effect(IdentityRepository, make);
