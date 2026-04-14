import { Duration, Effect } from "effect";
import { HttpEffect, HttpServerResponse } from "effect/unstable/http";

import {
  OAUTH_PKCE_VERIFIER_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "#entrypoints/http/groups/auth/oauth-state.ts";
import { getAuthorizationUrl } from "#use-cases/get-authorization-url.use-case.ts";

export const authorizeGoogleHandler = () =>
  Effect.gen(function* () {
    const result = yield* getAuthorizationUrl();

    yield* HttpEffect.appendPreResponseHandler((_req, response) =>
      Effect.succeed(
        HttpServerResponse.setCookieUnsafe(response, OAUTH_STATE_COOKIE_NAME, result.state, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: Duration.minutes(10),
        }),
      ),
    );

    yield* HttpEffect.appendPreResponseHandler((_req, response) =>
      Effect.succeed(
        HttpServerResponse.setCookieUnsafe(
          response,
          OAUTH_PKCE_VERIFIER_COOKIE_NAME,
          result.codeVerifier,
          {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: Duration.minutes(10),
          },
        ),
      ),
    );

    return { redirectUrl: result.redirectUrl, state: result.state };
  });
