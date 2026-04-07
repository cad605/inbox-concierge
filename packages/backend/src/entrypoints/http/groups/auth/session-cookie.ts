import { HttpApiSecurity } from "effect/unstable/httpapi";

/** Shared session cookie security for OAuth callback and auth-session routes. */
export const sessionCookieSecurity = HttpApiSecurity.apiKey({ key: "session", in: "cookie" });
