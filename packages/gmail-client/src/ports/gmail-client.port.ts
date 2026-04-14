import { type Effect, type Redacted, ServiceMap } from "effect";

import type { GmailApiError, HttpError, ValidationError } from "#domain/errors.ts";
import type { GmailThreadDetail, GmailThreadSummary } from "#domain/thread.ts";

export type GmailClientError = GmailApiError | HttpError | ValidationError;

export type GmailClientService = {
  readonly listThreads: (input: {
    readonly accessToken: Redacted.Redacted<string>;
    readonly maxResults: number;
  }) => Effect.Effect<ReadonlyArray<GmailThreadSummary>, GmailClientError>;

  readonly getThread: (input: {
    readonly accessToken: Redacted.Redacted<string>;
    readonly threadId: string;
  }) => Effect.Effect<GmailThreadDetail, GmailClientError>;
};

export class GmailClient extends ServiceMap.Service<GmailClient, GmailClientService>()(
  "@workspace/gmail-client/GmailClient",
) {}
