import { DateTime, Effect, Layer, Option, Redacted, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { AuthIdentityId } from "#domain/models/auth-identity.ts";
import { OAuthToken, OAuthTokenId } from "#domain/models/oauth-token.ts";
import { OAuthTokenRepository } from "#ports/oauth-token-repository.port.ts";
import { TokenEncryption } from "#ports/token-encryption.port.ts";

// OAuthToken stores encrypted strings in the DB but Redacted values in the domain model.
// A separate row struct + decryptRow step is required because the DB shape doesn't match the
// Model.Class select variant (encrypted ciphertext vs. Redacted<string>).
const OAuthTokenRow = Schema.Struct({
  id: OAuthTokenId,
  identityId: AuthIdentityId,
  accessToken: Schema.String,
  refreshToken: Schema.NullOr(Schema.String),
  tokenType: Schema.String,
  scopes: Schema.String,
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
});

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;
  const encryption = yield* TokenEncryption;

  const findTokenByIdentityId = SqlSchema.findOneOption({
    Request: AuthIdentityId,
    Result: OAuthTokenRow,
    execute: (identityId) =>
      sql`SELECT id, identity_id, access_token, refresh_token, token_type, scopes, expires_at, created_at, updated_at FROM oauth_tokens WHERE identity_id = ${identityId}`,
  });

  const decryptRow = Effect.fn("OAuthTokenRepository.decryptRow")(function* (
    row: typeof OAuthTokenRow.Type,
  ) {
    const accessToken = yield* encryption.decrypt(row.accessToken);
    const refreshToken =
      row.refreshToken !== null ? yield* encryption.decrypt(row.refreshToken) : null;

    return OAuthToken.makeUnsafe({
      id: row.id,
      identityId: row.identityId,
      accessToken: Redacted.make(accessToken),
      refreshToken: Option.map(Option.fromNullOr(refreshToken), Redacted.make),
      tokenType: row.tokenType,
      scopes: row.scopes,
      expiresAt: DateTime.fromDateUnsafe(row.expiresAt),
      createdAt: DateTime.fromDateUnsafe(row.createdAt),
      updatedAt: DateTime.fromDateUnsafe(row.updatedAt),
    });
  });

  const findByIdentityId = Effect.fn("OAuthTokenRepository.findByIdentityId")(
    function* (identityId: AuthIdentityId) {
      const row = yield* findTokenByIdentityId(identityId);
      if (Option.isNone(row)) return Option.none<OAuthToken>();
      const token = yield* decryptRow(row.value);
      return Option.some(token);
    },
    tapLogAndMapError("OAuthTokenRepository.findByIdentityId", AuthPersistenceError.fromError),
  );

  const upsert = Effect.fn("OAuthTokenRepository.upsert")(
    function* (input: {
      readonly id: OAuthTokenId;
      readonly identityId: AuthIdentityId;
      readonly accessToken: string;
      readonly refreshToken?: string | undefined;
      readonly tokenType: string;
      readonly scopes: string;
      readonly expiresAt: Date;
    }) {
      const encryptedAccessToken = yield* encryption.encrypt(input.accessToken);
      const encryptedRefreshToken =
        input.refreshToken != null ? yield* encryption.encrypt(input.refreshToken) : null;

      const now = new Date();

      yield* sql`
        INSERT INTO oauth_tokens ${sql.insert({
          id: input.id,
          identityId: input.identityId,
          accessToken: encryptedAccessToken,
          refreshToken: encryptedRefreshToken,
          tokenType: input.tokenType,
          scopes: input.scopes,
          expiresAt: input.expiresAt,
          createdAt: now,
          updatedAt: now,
        })}
        ON CONFLICT (identity_id) DO UPDATE SET
          access_token = EXCLUDED.access_token,
          refresh_token = COALESCE(EXCLUDED.refresh_token, oauth_tokens.refresh_token),
          token_type = EXCLUDED.token_type,
          scopes = EXCLUDED.scopes,
          expires_at = EXCLUDED.expires_at,
          updated_at = NOW()
      `;

      const row = yield* findTokenByIdentityId(input.identityId);
      if (Option.isNone(row)) {
        yield* Effect.logError("OAuthTokenRepository.upsert: row missing after upsert", {
          identityId: input.identityId,
        });
        return yield* Effect.fail(AuthPersistenceError.fromError());
      }
      return yield* decryptRow(row.value);
    },
    tapLogAndMapError("OAuthTokenRepository.upsert", AuthPersistenceError.fromError),
  );

  return OAuthTokenRepository.of({ findByIdentityId, upsert });
});

export const OAuthTokenRepositoryLive = Layer.effect(OAuthTokenRepository, make);
