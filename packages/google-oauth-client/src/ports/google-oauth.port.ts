import { type Effect, type Redacted, ServiceMap } from "effect";

import type { GoogleOAuthApiError, HttpError, ValidationError } from "#domain/errors.ts";
import type { GoogleTokenResponse } from "#domain/token-response.ts";
import type { GoogleUserInfo } from "#domain/user-info.ts";

export type GoogleOAuthError = GoogleOAuthApiError | HttpError | ValidationError;

export type GoogleOAuthService = {
  readonly getAuthorizationUrl: (params: {
    state: string;
    accessType: "offline" | "online";
    prompt: "select_account" | "consent" | "none";
    codeChallenge: string;
    /** When true (default), sends `include_granted_scopes=true`. Set false to omit. */
    includeGrantedScopes?: boolean;
  }) => Effect.Effect<string, never>;

  readonly exchangeAuthorizationCode: (
    code: string,
    codeVerifier: string,
  ) => Effect.Effect<GoogleTokenResponse, GoogleOAuthApiError | HttpError | ValidationError>;

  readonly refreshAccessToken: (
    refreshToken: Redacted.Redacted<string>,
  ) => Effect.Effect<GoogleTokenResponse, GoogleOAuthApiError | HttpError | ValidationError>;

  readonly fetchUserInfo: (
    accessToken: string,
  ) => Effect.Effect<GoogleUserInfo, GoogleOAuthApiError | HttpError | ValidationError>;

  readonly revokeToken: (token: string) => Effect.Effect<void, GoogleOAuthApiError | HttpError>;
};

export class GoogleOAuth extends ServiceMap.Service<GoogleOAuth, GoogleOAuthService>()(
  "@workspace/google-oauth-client/GoogleOAuth",
) {}
