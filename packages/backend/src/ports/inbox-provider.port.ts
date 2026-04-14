import { type Effect, ServiceMap } from "effect";
import type * as UCH from "effect/unstable/http/HttpClient";

import type { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";

export type InboxThreadListItem = {
  readonly threadId: string;
  readonly snippet: string;
  readonly historyId: string;
};

export type InboxThreadDetail = {
  readonly threadId: string;
  readonly messages: ReadonlyArray<{
    readonly messageId: string;
    readonly subject: string;
    readonly fromName: string | undefined;
    readonly fromEmail: string;
    readonly receivedAt: Date;
    readonly labelIds: ReadonlyArray<string>;
    readonly snippet: string;
    readonly bodyText: string;
    readonly toHeader: string | undefined;
    readonly ccHeader: string | undefined;
    readonly bccHeader: string | undefined;
  }>;
};

/** Outbound HTTP dependency for Gmail API calls. */
export type OutboundHttpClient = typeof UCH.HttpClient;

export class InboxProvider extends ServiceMap.Service<
  InboxProvider,
  {
    readonly listThreads: (input: {
      readonly accessToken: string;
      readonly maxResults: number;
    }) => Effect.Effect<ReadonlyArray<InboxThreadListItem>, InboxSyncError, OutboundHttpClient>;

    readonly getThread: (input: {
      readonly accessToken: string;
      readonly threadId: string;
    }) => Effect.Effect<InboxThreadDetail, InboxSyncError, OutboundHttpClient>;
  }
>()("app/ports/InboxProvider") {}
