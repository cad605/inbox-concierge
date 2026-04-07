import { type Effect, ServiceMap } from "effect";
import type { Redacted } from "effect/Redacted";

import type { AuthResult } from "#domain/dtos/auth-result.ts";
import type { OAuthTokenData } from "#domain/dtos/oauth-token-data.ts";
import type { ProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";

export class AuthProvider extends ServiceMap.Service<
  AuthProvider,
  {
    readonly getAuthorizationUrl: (state: string) => string;

    readonly handleCallback: (code: string) => Effect.Effect<AuthResult, ProviderAuthFailedError>;

    readonly refreshAccessToken: (
      refreshToken: Redacted<string>,
    ) => Effect.Effect<OAuthTokenData, ProviderAuthFailedError>;
  }
>()("app/ports/AuthProvider") {}
