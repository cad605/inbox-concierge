import { Config, Effect, Layer, Option, Redacted, Schema } from "effect";
import type { Redacted as RedactedValue } from "effect/Redacted";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { AuthResult } from "#domain/dtos/auth-result.ts";
import { OAuthTokenData } from "#domain/dtos/oauth-token-data.ts";
import { ProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";
import { Email } from "#domain/shared/email.ts";
import { ProviderId } from "#domain/shared/provider-id.ts";
import { AuthProvider } from "#ports/auth-provider.port.ts";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
];

class GoogleOAuthClientConfig extends Schema.Class<GoogleOAuthClientConfig>(
  "GoogleOAuthClientConfig",
)({
  clientId: Schema.String,
  clientSecret: Schema.Redacted(Schema.String),
  redirectUri: Schema.String,
}) {}

const GoogleTokenResponse = Schema.Struct({
  access_token: Schema.String,
  refresh_token: Schema.optional(Schema.String),
  expires_in: Schema.Number,
  token_type: Schema.String,
  scope: Schema.String,
  id_token: Schema.optional(Schema.String),
});

const GoogleUserInfo = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  verified_email: Schema.Boolean,
  name: Schema.optional(Schema.String),
  given_name: Schema.optional(Schema.String),
  family_name: Schema.optional(Schema.String),
  picture: Schema.optional(Schema.String),
});

type GoogleUserInfo = typeof GoogleUserInfo.Type;

const buildDisplayName = (userInfo: GoogleUserInfo): string => {
  if (userInfo.name) return userInfo.name;
  const givenName = userInfo.given_name ?? "";
  const familyName = userInfo.family_name ?? "";
  const fullName = `${givenName} ${familyName}`.trim();
  return fullName || userInfo.email;
};

const make = Effect.gen(function* () {
  const clientId = yield* Config.string("AUTH_GOOGLE_CLIENT_ID");
  const clientSecret = yield* Config.redacted("AUTH_GOOGLE_CLIENT_SECRET");
  const redirectUri = yield* Config.string("AUTH_GOOGLE_REDIRECT_URI");
  const config = GoogleOAuthClientConfig.makeUnsafe({ clientId, clientSecret, redirectUri });

  const httpClient = (yield* HttpClient.HttpClient).pipe(HttpClient.filterStatusOk);

  const getAuthorizationUrl = (state: string): string => {
    const params = new URLSearchParams();
    params.set("client_id", config.clientId);
    params.set("redirect_uri", config.redirectUri);
    params.set("response_type", "code");
    params.set("scope", GOOGLE_SCOPES.join(" "));
    params.set("state", state);
    params.set("access_type", "offline");
    params.set("prompt", "select_account");
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
  };

  const handleCallback = Effect.fn("AuthProviderGoogle.handleCallback")(function* (code: string) {
    const tokenResponse = yield* HttpClientRequest.post(GOOGLE_TOKEN_URL).pipe(
      HttpClientRequest.bodyUrlParams({
        client_id: config.clientId,
        client_secret: Redacted.value(config.clientSecret),
        code,
        grant_type: "authorization_code",
        redirect_uri: config.redirectUri,
      }),
      httpClient.execute,
      Effect.flatMap(HttpClientResponse.schemaBodyJson(GoogleTokenResponse)),
      Effect.mapError(
        (error) =>
          new ProviderAuthFailedError({ reason: `Token exchange failed: ${String(error)}` }),
      ),
    );

    const userInfo = yield* HttpClientRequest.get(GOOGLE_USERINFO_URL).pipe(
      HttpClientRequest.setHeader("Authorization", `Bearer ${tokenResponse.access_token}`),
      httpClient.execute,
      Effect.flatMap(HttpClientResponse.schemaBodyJson(GoogleUserInfo)),
      Effect.mapError(
        (error) =>
          new ProviderAuthFailedError({ reason: `Userinfo request failed: ${String(error)}` }),
      ),
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
      tokenData: Option.some(
        OAuthTokenData.makeUnsafe({
          accessToken: tokenResponse.access_token,
          refreshToken: Option.fromNullishOr(tokenResponse.refresh_token),
          expiresIn: tokenResponse.expires_in,
          tokenType: tokenResponse.token_type,
          scopes: tokenResponse.scope,
        }),
      ),
    });
  });

  const refreshAccessToken = Effect.fn("AuthProviderGoogle.refreshAccessToken")(function* (
    refreshToken: RedactedValue<string>,
  ) {
    const tokenResponse = yield* HttpClientRequest.post(GOOGLE_TOKEN_URL).pipe(
      HttpClientRequest.bodyUrlParams({
        client_id: config.clientId,
        client_secret: Redacted.value(config.clientSecret),
        grant_type: "refresh_token",
        refresh_token: Redacted.value(refreshToken),
      }),
      httpClient.execute,
      Effect.flatMap(HttpClientResponse.schemaBodyJson(GoogleTokenResponse)),
      Effect.mapError(
        (error) =>
          new ProviderAuthFailedError({ reason: `Token refresh failed: ${String(error)}` }),
      ),
    );

    return OAuthTokenData.makeUnsafe({
      accessToken: tokenResponse.access_token,
      refreshToken: Option.fromNullishOr(tokenResponse.refresh_token),
      expiresIn: tokenResponse.expires_in,
      tokenType: tokenResponse.token_type,
      scopes: tokenResponse.scope,
    });
  });

  return AuthProvider.of({ getAuthorizationUrl, handleCallback, refreshAccessToken });
});

export const AuthProviderGoogleLive = Layer.effect(AuthProvider, make);
