import { Effect, Layer, Redacted } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { GoogleOAuthApiError, HttpError, ValidationError } from "#domain/errors.ts";
import { GoogleTokenResponse } from "#domain/token-response.ts";
import { GoogleUserInfo } from "#domain/user-info.ts";
import {
  GOOGLE_OAUTH_AUTHORIZATION_URL,
  GOOGLE_OAUTH_REVOKE_URL,
  GOOGLE_OAUTH_TOKEN_URL,
  GOOGLE_OAUTH_USERINFO_URL,
  type GoogleOAuthConfig,
} from "#lib/oauth-client-config.ts";
import { GoogleOAuth } from "#ports/google-oauth.port.ts";

const make = (config: GoogleOAuthConfig) =>
  Effect.gen(function* () {
    const baseClient = yield* HttpClient.HttpClient;

    const client = baseClient.pipe(HttpClient.retryTransient({ times: 3 }));

    const getAuthorizationUrl = Effect.fn("GoogleOAuth.getAuthorizationUrl")(function* ({
      state,
      accessType,
      prompt,
      codeChallenge,
      includeGrantedScopes = true,
    }: {
      state: string;
      accessType: "offline" | "online";
      prompt: "select_account" | "consent" | "none";
      codeChallenge: string;
      /** When true (default), sends `include_granted_scopes=true` for incremental auth. */
      includeGrantedScopes?: boolean;
    }) {
      const search = new URLSearchParams();
      search.set("client_id", config.clientId);
      search.set("redirect_uri", config.redirectUri);
      search.set("response_type", "code");
      search.set("scope", config.scopes.join(" "));
      search.set("state", state);
      search.set("access_type", accessType ?? "offline");
      search.set("prompt", prompt ?? "select_account");
      search.set("code_challenge", codeChallenge);
      search.set("code_challenge_method", "S256");
      if (includeGrantedScopes !== false) {
        search.set("include_granted_scopes", "true");
      }
      return `${GOOGLE_OAUTH_AUTHORIZATION_URL}?${search.toString()}`;
    });

    const exchangeAuthorizationCode = Effect.fn("GoogleOAuth.exchangeAuthorizationCode")(
      function* (code: string, codeVerifier: string) {
        const url = GOOGLE_OAUTH_TOKEN_URL;
        const operation = "token_exchange" as const;

        const request = HttpClientRequest.post(url).pipe(
          HttpClientRequest.bodyUrlParams({
            client_id: config.clientId,
            client_secret: Redacted.value(config.clientSecret),
            code,
            code_verifier: codeVerifier,
            grant_type: "authorization_code",
            redirect_uri: config.redirectUri,
          }),
        );

        const response = yield* client.execute(request);

        return yield* HttpClientResponse.matchStatus(response, {
          "2xx": (self) => HttpClientResponse.schemaBodyJson(GoogleTokenResponse)(self),
          orElse: ({ request: { url }, status }) =>
            Effect.fail(
              new GoogleOAuthApiError({
                endpoint: url,
                statusCode: status,
                operation,
                error: new Error(`Unexpected status: ${status}`),
              }),
            ),
        });
      },

      Effect.catchTags({
        HttpClientError: ({ message, response }) =>
          Effect.fail(
            new HttpError({
              message,
              statusCode: response?.status,
            }),
          ),
        SchemaError: ({ message }) =>
          Effect.fail(
            new ValidationError({
              message,
            }),
          ),
      }),
    );

    const refreshAccessToken = Effect.fn("GoogleOAuth.refreshAccessToken")(
      function* (refreshToken: Redacted.Redacted<string>) {
        const url = GOOGLE_OAUTH_TOKEN_URL;
        const operation = "token_refresh" as const;

        const request = HttpClientRequest.post(url).pipe(
          HttpClientRequest.bodyUrlParams({
            client_id: config.clientId,
            client_secret: Redacted.value(config.clientSecret),
            grant_type: "refresh_token",
            refresh_token: Redacted.value(refreshToken),
          }),
        );

        const response = yield* client.execute(request);

        return yield* HttpClientResponse.matchStatus(response, {
          "2xx": (self) => HttpClientResponse.schemaBodyJson(GoogleTokenResponse)(self),
          orElse: ({ request: { url }, status }) =>
            Effect.fail(
              new GoogleOAuthApiError({
                endpoint: url,
                statusCode: status,
                operation,
                error: new Error(`Unexpected status: ${status}`),
              }),
            ),
        });
      },

      Effect.catchTags({
        HttpClientError: ({ message, response }) =>
          Effect.fail(
            new HttpError({
              message,
              statusCode: response?.status,
            }),
          ),
        SchemaError: ({ message }) =>
          Effect.fail(
            new ValidationError({
              message,
            }),
          ),
      }),
    );

    const fetchUserInfo = Effect.fn("GoogleOAuth.fetchUserInfo")(
      function* (accessToken: string) {
        const url = GOOGLE_OAUTH_USERINFO_URL;
        const operation = "userinfo" as const;

        const request = HttpClientRequest.get(url).pipe(
          HttpClientRequest.setHeader("Authorization", `Bearer ${accessToken}`),
          HttpClientRequest.acceptJson,
        );

        const response = yield* client.execute(request);

        return yield* HttpClientResponse.matchStatus(response, {
          "2xx": (self) => HttpClientResponse.schemaBodyJson(GoogleUserInfo)(self),
          orElse: ({ request: { url }, status }) =>
            Effect.fail(
              new GoogleOAuthApiError({
                endpoint: url,
                statusCode: status,
                operation,
                error: new Error(`Unexpected status: ${status}`),
              }),
            ),
        });
      },

      Effect.catchTags({
        HttpClientError: ({ message, response }) =>
          Effect.fail(
            new HttpError({
              message,
              statusCode: response?.status,
            }),
          ),
        SchemaError: ({ message }) =>
          Effect.fail(
            new ValidationError({
              message,
            }),
          ),
      }),
    );

    const revokeToken = Effect.fn("GoogleOAuth.revokeToken")(
      function* (token: string) {
        const url = GOOGLE_OAUTH_REVOKE_URL;
        const operation = "token_revoke" as const;

        const request = HttpClientRequest.post(url).pipe(
          HttpClientRequest.bodyUrlParams({
            token,
          }),
        );

        const response = yield* client.execute(request);

        return yield* HttpClientResponse.matchStatus(response, {
          "2xx": (self) => Effect.asVoid(self.text),
          orElse: ({ request: { url }, status }) =>
            Effect.fail(
              new GoogleOAuthApiError({
                endpoint: url,
                statusCode: status,
                operation,
                error: new Error(`Unexpected status: ${status}`),
              }),
            ),
        });
      },

      Effect.catchTags({
        HttpClientError: ({ message, response }) =>
          Effect.fail(
            new HttpError({
              message,
              statusCode: response?.status,
            }),
          ),
      }),
    );

    return GoogleOAuth.of({
      getAuthorizationUrl,
      exchangeAuthorizationCode,
      refreshAccessToken,
      fetchUserInfo,
      revokeToken,
    });
  });

export const GoogleOAuthLive = (config: GoogleOAuthConfig) =>
  Layer.effect(GoogleOAuth, make(config));
