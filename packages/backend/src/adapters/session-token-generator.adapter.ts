import { Effect, Layer } from "effect";

import { AuthSessionId } from "#domain/models/session.ts";
import { GenerateSessionToken } from "#ports/generate-session-token.port.ts";

const make = Effect.gen(function* () {
  const generate = Effect.fn("GenerateSessionToken.generate")(function* () {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const base64 = btoa(String.fromCharCode(...bytes));
    const base64url = base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return AuthSessionId.makeUnsafe(base64url);
  });

  return GenerateSessionToken.of({ generate });
});

export const SessionTokenGeneratorLive = Layer.effect(GenerateSessionToken, make);
