import { DateTime, Effect, Option } from "effect";

import { SessionExpiredError } from "#domain/errors/session-expired-error.ts";
import { SessionNotFoundError } from "#domain/errors/session-not-found-error.ts";
import type { AuthSessionId } from "#domain/models/session.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";
import { UserRepository } from "#ports/user-repository.port.ts";

export const validateSession = Effect.fn("validateSession")(function* (sessionId: AuthSessionId) {
  const sessionRepo = yield* SessionRepository;
  const userRepo = yield* UserRepository;

  const maybeSession = yield* sessionRepo.findById(sessionId);
  if (Option.isNone(maybeSession)) {
    return yield* new SessionNotFoundError();
  }
  const session = maybeSession.value;

  if (session.isExpired(DateTime.nowUnsafe())) {
    yield* sessionRepo.delete(sessionId);
    return yield* new SessionExpiredError();
  }

  const maybeUser = yield* userRepo.findById(session.userId);
  if (Option.isNone(maybeUser)) {
    return yield* new SessionNotFoundError();
  }

  return { user: maybeUser.value, session };
});
