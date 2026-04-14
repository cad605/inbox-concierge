import { generatePkce } from "@workspace/google-oauth-client";
import { Effect } from "effect";

import { AuthProvider } from "#ports/auth-provider.port.ts";

const generateState = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

export const getAuthorizationUrl = Effect.fn("getAuthorizationUrl")(function* () {
  const authProvider = yield* AuthProvider;

  const state = generateState();
  const { codeVerifier, codeChallenge } = yield* generatePkce();
  const redirectUrl = yield* authProvider.getAuthorizationUrl({
    state,
    accessType: "offline",
    prompt: "select_account",
    codeChallenge,
    includeGrantedScopes: true,
  });

  return { redirectUrl, state, codeVerifier };
});
