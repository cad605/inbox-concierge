import { type Effect, ServiceMap } from "effect";
import type { Redacted } from "effect/Redacted";

import type { AuthResult } from "#domain/dtos/auth-result.ts";
import type { OAuthTokenData } from "#domain/dtos/oauth-token-data.ts";
import type { ProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";

export class AuthProvider extends ServiceMap.Service<
  AuthProvider,
  {
    readonly getAuthorizationUrl: (params: {
      state: string;
      accessType: "offline" | "online";
      prompt: "select_account" | "consent" | "none";
      codeChallenge: string;
      includeGrantedScopes?: boolean;
    }) => Effect.Effect<string, never>;

    readonly handleCallback: (
      code: string,
      codeVerifier: string,
    ) => Effect.Effect<AuthResult, ProviderAuthFailedError>;

    readonly refreshAccessToken: (
      refreshToken: Redacted<string>,
    ) => Effect.Effect<OAuthTokenData, ProviderAuthFailedError>;

    readonly revokeToken: (token: Redacted<string>) => Effect.Effect<void, ProviderAuthFailedError>;
  }
>()("app/ports/AuthProvider") {}
