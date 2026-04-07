import { DateTime, Effect, Layer, Option, Redacted, Schema, ServiceMap } from "effect";
import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";

import { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import type { AuthUser } from "#domain/models/auth-user.ts";
import { AuthSessionId, type Session } from "#domain/models/session.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";
import { UserRepository } from "#ports/user-repository.port.ts";

export class CurrentUser extends ServiceMap.Service<CurrentUser, AuthUser>()(
  "app/HttpApi/Authorization/CurrentUser",
) {}

export class CurrentSession extends ServiceMap.Service<CurrentSession, Session>()(
  "app/HttpApi/Authorization/CurrentSession",
) {}

export class UnauthorizedError extends Schema.TaggedErrorClass<UnauthorizedError>()(
  "UnauthorizedError",
  {},
  { httpApiStatus: 401 },
) {
  override get message(): string {
    return "Authentication required";
  }
}

export const isUnauthorizedError = Schema.is(UnauthorizedError);

export class Authorization extends HttpApiMiddleware.Service<
  Authorization,
  {
    provides: CurrentUser | CurrentSession;
    requires: never;
  }
>()("app/HttpApi/Authorization", {
  requiredForClient: true,
  security: {
    cookie: HttpApiSecurity.apiKey({ key: "session", in: "cookie" }),
  },
  error: [UnauthorizedError, AuthPersistenceError],
}) {}

export const AuthorizationLive = Layer.effect(
  Authorization,
  Effect.gen(function* () {
    const sessionRepo = yield* SessionRepository;
    const userRepo = yield* UserRepository;

    return Authorization.of({
      cookie: Effect.fn(function* (httpEffect, { credential }) {
        const token = Redacted.value(credential);
        const sessionId = yield* Schema.decodeUnknownEffect(AuthSessionId)(token).pipe(
          Effect.mapError(() => new UnauthorizedError()),
        );

        const maybeSession = yield* sessionRepo.findById(sessionId);
        if (Option.isNone(maybeSession)) {
          return yield* new UnauthorizedError();
        }
        const session = maybeSession.value;

        if (session.isExpired(DateTime.nowUnsafe())) {
          yield* sessionRepo.delete(sessionId);
          return yield* new UnauthorizedError();
        }

        const maybeUser = yield* userRepo.findById(session.userId);
        if (Option.isNone(maybeUser)) {
          return yield* new UnauthorizedError();
        }

        return yield* httpEffect.pipe(
          Effect.provideService(CurrentUser, maybeUser.value),
          Effect.provideService(CurrentSession, session),
        );
      }),
    });
  }),
);
