import { GmailClientLive as GmailClientLiveLayer } from "@workspace/gmail-client";
import { Config, Effect, Layer } from "effect";

const GmailClientConfig = Config.all({
  clientId: Config.string("AUTH_GOOGLE_CLIENT_ID"),
  clientSecret: Config.redacted("AUTH_GOOGLE_CLIENT_SECRET"),
});

export const GmailClientLive = Layer.unwrap(
  Effect.gen(function* () {
    const config = yield* GmailClientConfig;

    return GmailClientLiveLayer(config);
  }),
);
