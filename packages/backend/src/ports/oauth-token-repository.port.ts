import { type Effect, type Option, ServiceMap } from "effect";

import type { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import type { AuthIdentityId } from "#domain/models/auth-identity.ts";
import type { OAuthToken, OAuthTokenId } from "#domain/models/oauth-token.ts";

export class OAuthTokenRepository extends ServiceMap.Service<
  OAuthTokenRepository,
  {
    readonly findByIdentityId: (
      identityId: AuthIdentityId,
    ) => Effect.Effect<Option.Option<OAuthToken>, AuthPersistenceError>;

    readonly upsert: (input: {
      readonly id: OAuthTokenId;
      readonly identityId: AuthIdentityId;
      readonly accessToken: string;
      readonly refreshToken?: string | undefined;
      readonly tokenType: string;
      readonly scopes: string;
      readonly expiresAt: Date;
    }) => Effect.Effect<OAuthToken, AuthPersistenceError>;
  }
>()("app/ports/OAuthTokenRepository") {}
