import { GoogleOAuthLive as GoogleOAuthLiveLayer } from "@workspace/google-oauth-client";
import { Config, Effect, Layer } from "effect";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
];

const OAuthClientConfig = Config.all({
  clientId: Config.string("AUTH_GOOGLE_CLIENT_ID"),
  clientSecret: Config.redacted("AUTH_GOOGLE_CLIENT_SECRET"),
  redirectUri: Config.string("AUTH_GOOGLE_REDIRECT_URI"),
  scopes: Config.succeed(GOOGLE_SCOPES),
});

export const GoogleOAuthLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* OAuthClientConfig;

    return GoogleOAuthLiveLayer(config);
  }),
);
