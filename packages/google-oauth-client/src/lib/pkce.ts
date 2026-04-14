import { Effect } from "effect";

const base64UrlEncode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** RFC 7636: 43–128 chars from [A-Z] / [a-z] / [0-9] / "-" / "." / "_" / "~" */
export const randomCodeVerifier = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
};

export const codeChallengeS256 = (codeVerifier: string): Effect.Effect<string, never> =>
  Effect.promise(async () => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    return base64UrlEncode(new Uint8Array(digest));
  });

export const generatePkce = (): Effect.Effect<
  { readonly codeVerifier: string; readonly codeChallenge: string },
  never
> =>
  Effect.gen(function* () {
    const codeVerifier = randomCodeVerifier();
    const codeChallenge = yield* codeChallengeS256(codeVerifier);
    return { codeVerifier, codeChallenge };
  });
