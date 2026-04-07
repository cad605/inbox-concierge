import { Effect, Option } from "effect";

import { SessionNotFoundError } from "#domain/errors/session-not-found-error.ts";
import type { AuthSessionId } from "#domain/models/session.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";

export const logout = Effect.fn("logout")(function* (sessionId: AuthSessionId) {
  const sessionRepo = yield* SessionRepository;

  const maybeSession = yield* sessionRepo.findById(sessionId);
  if (Option.isNone(maybeSession)) {
    return yield* new SessionNotFoundError();
  }

  yield* sessionRepo.delete(sessionId);
});
