import { Duration, Effect, Option } from "effect";
import { HttpEffect, HttpServerResponse } from "effect/unstable/http";
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi";

import { isInboxNotConnectedError } from "#domain/errors/inbox-not-connected-error.ts";
import { isInboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { isOAuthStateError } from "#domain/errors/oauth-state-error.ts";
import { isProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";
import { UserAgent } from "#domain/shared/user-agent.ts";
import type { GoogleOAuthCallbackQuery } from "#entrypoints/http/groups/auth/auth-api.ts";
import {
  OAUTH_PKCE_VERIFIER_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
} from "#entrypoints/http/groups/auth/oauth-state.ts";
import { sessionCookieSecurity } from "#entrypoints/http/groups/auth/session-cookie.ts";
import { HttpConfig } from "#entrypoints/http/http.config.ts";
import { getCookieValue } from "#lib/get-cookie-value.ts";
import { headerString } from "#lib/header-string.ts";
import { handleOAuthCallback } from "#use-cases/handle-oauth-callback.use-case.ts";
import { initializeNewUser } from "#use-cases/initialize-new-user.use-case.ts";

/**
 * Public `error` query values for `/sign-in?error=` (Effect failures from the callback flow).
 * Google OAuth error redirects use `access_denied` or `provider` directly — keep in sync with the web route schema.
 */
const mapCallbackFailure = (error: unknown) => {
  if (isProviderAuthFailedError(error)) {
    return "provider";
  }
  if (isOAuthStateError(error)) {
    return "oauth_state";
  }
  if (isInboxNotConnectedError(error)) {
    return "inbox";
  }
  if (isInboxSyncError(error)) {
    return "sync";
  }
  return "server";
};

const redirectSuccess = (webAppUrl: string) =>
  HttpServerResponse.redirect(new URL("/", webAppUrl).toString());

const redirectSignInWithError = (
  webAppUrl: string,
  code: "oauth_state" | "access_denied" | "provider" | "inbox" | "sync" | "server",
) => {
  const url = new URL("/sign-in", webAppUrl);
  url.searchParams.set("error", code);
  return HttpServerResponse.redirect(url.toString());
};

export const callbackGoogleHandler = ({
  query,
  request,
}: {
  readonly query: GoogleOAuthCallbackQuery;
  readonly request: {
    readonly headers: Record<string, string | Array<string> | undefined>;
    readonly remoteAddress?: Option.Option<string>;
  };
}) =>
  Effect.gen(function* () {
    const { webAppUrl } = yield* HttpConfig.asEffect().pipe(
      Effect.catchTag("ConfigError", () => Effect.fail(HttpApiError.BadRequest.singleton)),
    );

    const storedState = getCookieValue(request.headers, OAUTH_STATE_COOKIE_NAME);
    const codeVerifier = getCookieValue(request.headers, OAUTH_PKCE_VERIFIER_COOKIE_NAME);

    yield* HttpEffect.appendPreResponseHandler((_req, response) =>
      Effect.succeed(
        HttpServerResponse.setCookieUnsafe(response, OAUTH_STATE_COOKIE_NAME, "", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: Duration.seconds(0),
        }),
      ),
    );

    yield* HttpEffect.appendPreResponseHandler((_req, response) =>
      Effect.succeed(
        HttpServerResponse.setCookieUnsafe(response, OAUTH_PKCE_VERIFIER_COOKIE_NAME, "", {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
          maxAge: Duration.seconds(0),
        }),
      ),
    );

    if (storedState !== query.state) {
      return redirectSignInWithError(webAppUrl, "oauth_state");
    }

    if ("error" in query) {
      return redirectSignInWithError(
        webAppUrl,
        query.error === "access_denied" ? "access_denied" : "provider",
      );
    }

    const ua = headerString(request.headers, "user-agent");
    const userAgent = ua != null ? Option.some(UserAgent.makeUnsafe(ua)) : Option.none<UserAgent>();

    if (codeVerifier == null) {
      return redirectSignInWithError(webAppUrl, "oauth_state");
    }

    return yield* Effect.matchEffect(
      Effect.gen(function* () {
        const { user, session, isNewUser } = yield* handleOAuthCallback({
          code: query.code,
          codeVerifier,
          userAgent,
          ipAddress: request.remoteAddress ?? Option.none(),
        });

        if (isNewUser) {
          yield* initializeNewUser(user.id);
        }

        yield* HttpApiBuilder.securitySetCookie(sessionCookieSecurity, session.id, {
          sameSite: "strict",
          path: "/",
          maxAge: Duration.days(7),
        });

        return redirectSuccess(webAppUrl);
      }),
      {
        onFailure: (error) =>
          Effect.succeed(redirectSignInWithError(webAppUrl, mapCallbackFailure(error))),
        onSuccess: (response) => Effect.succeed(response),
      },
    );
  });
