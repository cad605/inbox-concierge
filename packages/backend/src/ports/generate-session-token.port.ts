import { type Effect, ServiceMap } from "effect";

import type { AuthSessionId } from "#domain/models/session.ts";

export class GenerateSessionToken extends ServiceMap.Service<
  GenerateSessionToken,
  {
    readonly generate: () => Effect.Effect<AuthSessionId>;
  }
>()("app/ports/GenerateSessionToken") {}
