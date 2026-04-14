import { GoogleOAuth, type GoogleUserInfo } from "@workspace/google-oauth-client";
import { Effect, Layer, Option, Redacted } from "effect";
import type { Redacted as RedactedValue } from "effect/Redacted";

import { AuthResult } from "#domain/dtos/auth-result.ts";
import { OAuthTokenData } from "#domain/dtos/oauth-token-data.ts";
import { ProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";
import { Email } from "#domain/shared/email.ts";
import { ProviderId } from "#domain/shared/provider-id.ts";
import { AuthProvider } from "#ports/auth-provider.port.ts";

const make = Effect.gen(function* () {
  const google = yield* GoogleOAuth;

  const buildDisplayName = (userInfo: GoogleUserInfo): string => {
    if (userInfo.name) return userInfo.name;
    const givenName = userInfo.given_name ?? "";
    const familyName = userInfo.family_name ?? "";
    const fullName = `${givenName} ${familyName}`.trim();
    return fullName || userInfo.email;
  };

  const oauthTokenDataFromResponse = (tokenResponse: {
    access_token: string;
    refresh_token?: string | undefined;
    expires_in: number;
    token_type: string;
    scope: string;
    refresh_token_expires_in?: number | undefined;
  }) =>
    OAuthTokenData.makeUnsafe({
      accessToken: tokenResponse.access_token,
      refreshToken: Option.fromNullishOr(tokenResponse.refresh_token),
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type,
      scopes: tokenResponse.scope,
      refreshTokenExpiresIn: Option.fromNullishOr(tokenResponse.refresh_token_expires_in),
    });

  const getAuthorizationUrl = Effect.fn("AuthProviderGoogle.getAuthorizationUrl")(function* ({
    state,
    accessType,
    prompt,
    codeChallenge,
    includeGrantedScopes,
  }: {
    state: string;
    accessType: "offline" | "online";
    prompt: "select_account" | "consent" | "none";
    codeChallenge: string;
    includeGrantedScopes?: boolean;
  }) {
    return yield* google.getAuthorizationUrl({
      state,
      accessType,
      prompt,
      codeChallenge,
      includeGrantedScopes,
    });
  });

  const handleCallback = Effect.fn("AuthProviderGoogle.handleCallback")(function* (
    code: string,
    codeVerifier: string,
  ) {
    const tokenResponse = yield* google
      .exchangeAuthorizationCode(code, codeVerifier)
      .pipe(
        Effect.mapError(() => new ProviderAuthFailedError({ reason: "Token exchange failed" })),
      );

    const userInfo = yield* google
      .fetchUserInfo(tokenResponse.access_token)
      .pipe(
        Effect.mapError(() => new ProviderAuthFailedError({ reason: "Userinfo request failed" })),
      );

    return AuthResult.makeUnsafe({
      provider: "google",
      providerId: ProviderId.makeUnsafe(userInfo.id),
      email: Email.makeUnsafe(userInfo.email),
      displayName: buildDisplayName(userInfo),
      emailVerified: userInfo.verified_email,
      providerData: Option.some({
        profile: {
          picture: userInfo.picture,
          given_name: userInfo.given_name,
          family_name: userInfo.family_name,
        },
      }),
      tokenData: Option.some(oauthTokenDataFromResponse(tokenResponse)),
    });
  });

  const refreshAccessToken = Effect.fn("AuthProviderGoogle.refreshAccessToken")(function* (
    refreshToken: RedactedValue<string>,
  ) {
    const tokenResponse = yield* google
      .refreshAccessToken(refreshToken)
      .pipe(Effect.mapError(() => new ProviderAuthFailedError({ reason: "Token refresh failed" })));

    return oauthTokenDataFromResponse(tokenResponse);
  });

  const revokeToken = Effect.fn("AuthProviderGoogle.revokeToken")(function* (
    token: RedactedValue<string>,
  ) {
    yield* google
      .revokeToken(Redacted.value(token))
      .pipe(
        Effect.mapError(() => new ProviderAuthFailedError({ reason: "Token revocation failed" })),
      );
  });

  return AuthProvider.of({
    getAuthorizationUrl,
    handleCallback,
    refreshAccessToken,
    revokeToken,
  });
});

export const AuthProviderGoogleLive = Layer.effect(AuthProvider, make);
