/**
 * Effect-native Google OAuth 2.0 (authorization code + refresh token), PKCE, userinfo, and revocation.
 *
 * Uses `effect/unstable/http` {@link HttpClient} with {@link HttpClient.retryTransient},
 * {@link HttpClientResponse.matchStatus}, and the same error style as `gmail-client`.
 *
 * @example
 * ```ts
 * import { Effect, Layer, Redacted } from "effect"
 * import { FetchHttpClient } from "effect/unstable/http"
 * import { GoogleOAuth, GoogleOAuthLive } from "@workspace/google-oauth-client"
 *
 * const config = {
 *   clientId: "...",
 *   clientSecret: Redacted.make("..."),
 *   redirectUri: "http://localhost/callback",
 *   scopes: ["openid", "email"],
 * }
 *
 * const program = Effect.gen(function* () {
 *   const google = yield* GoogleOAuth
 *   const token = yield* google.exchangeAuthorizationCode("auth-code", "pkce-verifier")
 *   return yield* google.fetchUserInfo(token.access_token)
 * })
 *
 * program.pipe(
 *   Effect.provide(Layer.mergeAll(GoogleOAuthLive(config), FetchHttpClient.layer)),
 *   Effect.runPromise,
 * )
 * ```
 *
 * @module
 */

export { GoogleOAuthLive } from "./adapters/google-oauth.adapter.ts";
export { GoogleOAuth } from "./ports/google-oauth.port.ts";
export { codeChallengeS256, generatePkce, randomCodeVerifier } from "./lib/pkce.ts";
export type { GoogleOAuthConfig } from "./lib/oauth-client-config.ts";
export type { GoogleUserInfo } from "./domain/user-info.ts";
