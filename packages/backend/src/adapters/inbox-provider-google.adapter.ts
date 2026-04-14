import { GmailClient } from "@workspace/gmail-client";
import { Effect, Layer, Redacted } from "effect";

import { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { InboxProvider, type InboxThreadDetail } from "#ports/inbox-provider.port.ts";

const make = Effect.gen(function* () {
  const gmail = yield* GmailClient;

  const listThreads = Effect.fn("InboxProvider.listThreads")(function* (input: {
    readonly accessToken: string;
    readonly maxResults: number;
  }) {
    return yield* gmail
      .listThreads({
        accessToken: Redacted.make(input.accessToken),
        maxResults: input.maxResults,
      })
      .pipe(tapLogAndMapError("InboxProvider.listThreads", InboxSyncError.fromError));
  });

  const getThread = Effect.fn("InboxProvider.getThread")(function* (input: {
    readonly accessToken: string;
    readonly threadId: string;
  }) {
    const detail = yield* gmail
      .getThread({
        accessToken: Redacted.make(input.accessToken),
        threadId: input.threadId,
      })
      .pipe(tapLogAndMapError("InboxProvider.getThread", InboxSyncError.fromError));

    return detail satisfies InboxThreadDetail;
  });

  return InboxProvider.of({ listThreads, getThread });
});

export const InboxProviderGoogleLive = Layer.effect(InboxProvider, make);
