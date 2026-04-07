import { Duration, Effect, Option } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { UserAgent } from "#domain/shared/user-agent.ts";
import { sessionCookieSecurity } from "#entrypoints/http/groups/auth/session-cookie.ts";
import { CurrentSession, CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { headerString } from "#lib/header-string.ts";
import { refreshSession } from "#use-cases/refresh-session.use-case.ts";

export const refreshHandler = ({
  request,
}: {
  readonly request: {
    readonly headers: Record<string, string | Array<string> | undefined>;
    readonly remoteAddress?: Option.Option<string>;
  };
}) =>
  Effect.gen(function* () {
    const currentSession = yield* CurrentSession;
    const user = yield* CurrentUser;

    const ua = headerString(request.headers, "user-agent");
    const userAgent = ua != null ? Option.some(UserAgent.makeUnsafe(ua)) : Option.none<UserAgent>();

    const newSession = yield* refreshSession({
      currentSessionId: currentSession.id,
      userId: user.id,
      provider: currentSession.provider,
      userAgent,
      ipAddress: request.remoteAddress ?? Option.none(),
    });

    yield* HttpApiBuilder.securitySetCookie(sessionCookieSecurity, newSession.id, {
      sameSite: "strict",
      path: "/",
      maxAge: Duration.days(7),
    });

    return { user };
  });
