import { Effect } from "effect";

import type { AuthSessionId } from "#domain/models/session.ts";
import { validateSession } from "#use-cases/validate-session.use-case.ts";

export const getCurrentUser = Effect.fn("getCurrentUser")(function* (sessionId: AuthSessionId) {
  const { user } = yield* validateSession(sessionId);
  return user;
});
