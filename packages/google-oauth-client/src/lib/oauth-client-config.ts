import type { Redacted } from "effect";

/** Google OAuth 2.0 authorization endpoint (browser redirect). */
export const GOOGLE_OAUTH_AUTHORIZATION_URL =
  "https://accounts.google.com/o/oauth2/v2/auth" as const;

/** Google token endpoint (authorization code and refresh_token exchange). */
export const GOOGLE_OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token" as const;

/** Google OpenID Connect / OAuth2 userinfo (v2 endpoint). */
export const GOOGLE_OAUTH_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo" as const;

/** Revoke an access or refresh token (RFC 7009-style; Google web-server doc). */
export const GOOGLE_OAUTH_REVOKE_URL = "https://oauth2.googleapis.com/revoke" as const;

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: Redacted.Redacted<string>;
  redirectUri: string;
  scopes: Array<string>;
}
