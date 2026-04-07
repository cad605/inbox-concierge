import { Duration, Effect } from "effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";

import { sessionCookieSecurity } from "#entrypoints/http/groups/auth/session-cookie.ts";
import { CurrentSession } from "#entrypoints/http/middleware/auth.middleware.ts";
import { logout } from "#use-cases/logout.use-case.ts";

export const logoutHandler = () =>
  Effect.gen(function* () {
    const session = yield* CurrentSession;

    yield* logout(session.id);

    yield* HttpApiBuilder.securitySetCookie(sessionCookieSecurity, "", {
      sameSite: "strict",
      path: "/",
      maxAge: Duration.seconds(0),
    });
  });
