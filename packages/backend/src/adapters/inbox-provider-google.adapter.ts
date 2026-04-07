import { Effect, Layer, Schedule, Schema, flow } from "effect";
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";

import { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import {
  InboxProvider,
  type InboxThreadDetail,
  type InboxThreadListItem,
} from "#ports/inbox-provider.port.ts";

const GMAIL_API_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

const GmailThreadListItemResponse = Schema.Struct({
  id: Schema.String,
  snippet: Schema.optional(Schema.String),
  historyId: Schema.optional(Schema.String),
});

const GmailThreadListResponse = Schema.Struct({
  threads: Schema.optional(Schema.Array(GmailThreadListItemResponse)),
});

const GmailHeader = Schema.Struct({
  name: Schema.String,
  value: Schema.String,
});

const GmailPayloadBody = Schema.Struct({
  data: Schema.optional(Schema.String),
});

interface GmailMimePart {
  readonly mimeType?: string | undefined;
  readonly body?: { readonly data?: string | undefined } | undefined;
  readonly parts?: ReadonlyArray<GmailMimePart> | undefined;
}

const GmailMimePart: Schema.Codec<GmailMimePart> = Schema.Struct({
  mimeType: Schema.optional(Schema.String),
  body: Schema.optional(GmailPayloadBody),
  parts: Schema.optional(
    Schema.Array(Schema.suspend((): Schema.Codec<GmailMimePart> => GmailMimePart)),
  ),
});

const GmailMessageResponse = Schema.Struct({
  id: Schema.String,
  threadId: Schema.String,
  labelIds: Schema.optional(Schema.Array(Schema.String)),
  snippet: Schema.optional(Schema.String),
  internalDate: Schema.optional(Schema.String),
  payload: Schema.optional(
    Schema.Struct({
      headers: Schema.optional(Schema.Array(GmailHeader)),
      mimeType: Schema.optional(Schema.String),
      body: Schema.optional(GmailPayloadBody),
      parts: Schema.optional(Schema.Array(GmailMimePart)),
    }),
  ),
});

const GmailThreadDetailResponse = Schema.Struct({
  id: Schema.String,
  messages: Schema.optional(Schema.Array(GmailMessageResponse)),
});

type GmailHeaderType = typeof GmailHeader.Type;

const findHeader = (
  headers: ReadonlyArray<GmailHeaderType> | undefined,
  name: string,
): string | undefined => headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

const parseFromHeader = (from: string): { name: string | undefined; email: string } => {
  const match = from.match(/^(.+?)\s*<(.+)>$/);
  if (match && match[1] !== undefined && match[2] !== undefined) {
    return { name: match[1].trim().replace(/^"|"$/g, ""), email: match[2] };
  }
  return { name: undefined, email: from.trim() };
};

const decodeBase64Url = (data: string): string => {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
};

export const stripHtml = (html: string): string =>
  html
    .replace(/<script[\s>][\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s>][\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:p|div|tr|li|blockquote|h[1-6])>/gi, "\n\n")
    .replace(/<\/(?:td|th)>/gi, "\t")
    .replace(/<li[\s>]/gi, "\n- ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(Number.parseInt(h, 16)))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

type GmailPayload = NonNullable<(typeof GmailMessageResponse)["Type"]["payload"]>;

const findPlainText = (part: GmailMimePart): string | undefined => {
  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data);
  }
  for (const child of part.parts ?? []) {
    const found = findPlainText(child);
    if (found !== undefined) return found;
  }
  return undefined;
};

const findHtmlText = (part: GmailMimePart): string | undefined => {
  if (part.mimeType === "text/html" && part.body?.data) {
    return stripHtml(decodeBase64Url(part.body.data));
  }
  for (const child of part.parts ?? []) {
    const found = findHtmlText(child);
    if (found !== undefined) return found;
  }
  return undefined;
};

export const extractBodyText = (payload: GmailPayload): string => {
  const root: GmailMimePart = {
    mimeType: payload.mimeType,
    body: payload.body,
    parts: payload.parts,
  };
  return findPlainText(root) ?? findHtmlText(root) ?? "";
};

const make = Effect.gen(function* () {
  const client = (yield* HttpClient.HttpClient).pipe(
    HttpClient.mapRequest(
      flow(HttpClientRequest.prependUrl(GMAIL_API_BASE), HttpClientRequest.acceptJson),
    ),
    HttpClient.filterStatusOk,
    HttpClient.retryTransient({
      schedule: Schedule.exponential(100),
      times: 3,
    }),
  );

  const listThreads = Effect.fn("InboxProvider.listThreads")(function* (input: {
    readonly accessToken: string;
    readonly maxResults: number;
  }) {
    const response = yield* client
      .get("/threads", {
        urlParams: { maxResults: input.maxResults },
        headers: { Authorization: `Bearer ${input.accessToken}` },
      })
      .pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(GmailThreadListResponse)),
        tapLogAndMapError("InboxProvider.listThreads", InboxSyncError.fromError),
      );

    return (response.threads ?? []).map(
      (t): InboxThreadListItem => ({
        threadId: t.id,
        snippet: t.snippet ?? "",
        historyId: t.historyId ?? "",
      }),
    );
  });

  const getThread = Effect.fn("InboxProvider.getThread")(function* (input: {
    readonly accessToken: string;
    readonly threadId: string;
  }) {
    const response = yield* client
      .get(`/threads/${input.threadId}`, {
        urlParams: { format: "FULL" },
        headers: { Authorization: `Bearer ${input.accessToken}` },
      })
      .pipe(
        Effect.flatMap(HttpClientResponse.schemaBodyJson(GmailThreadDetailResponse)),
        tapLogAndMapError("InboxProvider.getThread", InboxSyncError.fromError),
      );

    const messages = (response.messages ?? []).map((msg) => {
      const headers = msg.payload?.headers;
      const subject = findHeader(headers, "Subject") ?? "(no subject)";
      const fromRaw = findHeader(headers, "From") ?? "";
      const { name: fromName, email: fromEmail } = parseFromHeader(fromRaw);
      const toHeader = findHeader(headers, "To");
      const ccHeader = findHeader(headers, "Cc");
      const bccHeader = findHeader(headers, "Bcc");
      const bodyText = msg.payload ? extractBodyText(msg.payload) : "";
      const receivedAt = msg.internalDate ? new Date(Number(msg.internalDate)) : new Date();

      return {
        messageId: msg.id,
        subject,
        fromName,
        fromEmail,
        receivedAt,
        labelIds: msg.labelIds ?? [],
        snippet: msg.snippet ?? "",
        bodyText,
        toHeader,
        ccHeader,
        bccHeader,
      };
    });

    return { threadId: response.id, messages } satisfies InboxThreadDetail;
  });

  return InboxProvider.of({ listThreads, getThread });
});

export const InboxProviderGoogleLive = Layer.effect(InboxProvider, make);
