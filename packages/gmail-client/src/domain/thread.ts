import { Schema, SchemaTransformation } from "effect";

import { extractBodyText, parseFromHeader } from "#lib/mime.ts";

// -----------------------------------------------------------------------------
// Raw (Gmail API JSON)
// -----------------------------------------------------------------------------

/** Gmail API v1 `users.threads.list` row — raw JSON. */
export const GmailThreadListItemRaw = Schema.Struct({
  id: Schema.String,
  snippet: Schema.optional(Schema.String),
  historyId: Schema.optional(Schema.String),
});

export type GmailThreadListItemRawDecoded = typeof GmailThreadListItemRaw.Type;

/** Gmail API v1 `users.threads.list` response body — raw JSON. */
export const GmailThreadsListRaw = Schema.Struct({
  threads: Schema.optional(Schema.Array(GmailThreadListItemRaw)),
});

export type GmailThreadsListRawDecoded = typeof GmailThreadsListRaw.Type;

/** `MessagePart.header` — raw JSON. */
export const GmailMessageHeaderRaw = Schema.Struct({
  name: Schema.String,
  value: Schema.String,
});

export type GmailMessageHeaderRawDecoded = typeof GmailMessageHeaderRaw.Type;

/** `MessagePart.body` — raw JSON. */
export const GmailMessagePayloadBodyRaw = Schema.Struct({
  data: Schema.optional(Schema.String),
});

export type GmailMessagePayloadBodyRawDecoded = typeof GmailMessagePayloadBodyRaw.Type;

/** Recursive MIME tree node decoded from Gmail `MessagePart` JSON. */
export interface GmailMimeTreeNodeRaw {
  readonly mimeType?: string | undefined;
  readonly body?: { readonly data?: string | undefined } | undefined;
  readonly parts?: ReadonlyArray<GmailMimeTreeNodeRaw> | undefined;
}

/** Gmail API `MessagePart` — raw JSON (recursive). */
export const GmailMimePartRaw: Schema.Codec<GmailMimeTreeNodeRaw> = Schema.Struct({
  mimeType: Schema.optional(Schema.String),
  body: Schema.optional(GmailMessagePayloadBodyRaw),
  parts: Schema.optional(
    Schema.Array(Schema.suspend((): Schema.Codec<GmailMimeTreeNodeRaw> => GmailMimePartRaw)),
  ),
});

/** `Message.payload` — raw JSON. */
export const GmailMessagePayloadRaw = Schema.Struct({
  headers: Schema.optional(Schema.Array(GmailMessageHeaderRaw)),
  mimeType: Schema.optional(Schema.String),
  body: Schema.optional(GmailMessagePayloadBodyRaw),
  parts: Schema.optional(Schema.Array(GmailMimePartRaw)),
});

export type GmailMessagePayloadRawDecoded = typeof GmailMessagePayloadRaw.Type;

/** Gmail API v1 `Message` resource — raw JSON. */
export const GmailMessageRaw = Schema.Struct({
  id: Schema.String,
  threadId: Schema.String,
  labelIds: Schema.optional(Schema.Array(Schema.String)),
  snippet: Schema.optional(Schema.String),
  internalDate: Schema.optional(Schema.String),
  payload: Schema.optional(GmailMessagePayloadRaw),
});

export type GmailMessageRawDecoded = typeof GmailMessageRaw.Type;

/** Gmail API v1 `Thread` resource (full format) — raw JSON. */
export const GmailThreadDetailRaw = Schema.Struct({
  id: Schema.String,
  messages: Schema.optional(Schema.Array(GmailMessageRaw)),
});

export type GmailThreadDetailRawDecoded = typeof GmailThreadDetailRaw.Type;

// -----------------------------------------------------------------------------
// Domain
// -----------------------------------------------------------------------------

export const GmailThreadSummary = Schema.Struct({
  threadId: Schema.String,
  snippet: Schema.String,
  historyId: Schema.String,
});

export type GmailThreadSummary = typeof GmailThreadSummary.Type;

export const GmailThreadMessage = Schema.Struct({
  messageId: Schema.String,
  subject: Schema.String,
  fromName: Schema.UndefinedOr(Schema.String),
  fromEmail: Schema.String,
  receivedAt: Schema.Date,
  labelIds: Schema.Array(Schema.String),
  snippet: Schema.String,
  bodyText: Schema.String,
  toHeader: Schema.UndefinedOr(Schema.String),
  ccHeader: Schema.UndefinedOr(Schema.String),
  bccHeader: Schema.UndefinedOr(Schema.String),
});

export type GmailThreadMessage = typeof GmailThreadMessage.Type;

export const GmailThreadDetail = Schema.Struct({
  threadId: Schema.String,
  messages: Schema.mutable(Schema.Array(GmailThreadMessage)),
});

export type GmailThreadDetail = typeof GmailThreadDetail.Type;

// -----------------------------------------------------------------------------
// Wire → domain (HTTP response bodies)
// -----------------------------------------------------------------------------

const findHeader = (
  headers: ReadonlyArray<GmailMessageHeaderRawDecoded> | undefined,
  name: string,
): string | undefined => headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value;

const threadMessageFromRaw = (msg: GmailMessageRawDecoded): GmailThreadMessage => {
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
    labelIds: [...(msg.labelIds ?? [])],
    snippet: msg.snippet ?? "",
    bodyText,
    toHeader,
    ccHeader,
    bccHeader,
  };
};

const formatFromHeader = (fromName: string | undefined, fromEmail: string): string =>
  fromName === undefined || fromName === "" ? fromEmail : `${fromName} <${fromEmail}>`;

const threadMessageToRaw = (msg: GmailThreadMessage, threadId: string): GmailMessageRawDecoded => {
  const headers: Array<GmailMessageHeaderRawDecoded> = [
    { name: "Subject", value: msg.subject },
    { name: "From", value: formatFromHeader(msg.fromName, msg.fromEmail) },
  ];
  if (msg.toHeader !== undefined) headers.push({ name: "To", value: msg.toHeader });
  if (msg.ccHeader !== undefined) headers.push({ name: "Cc", value: msg.ccHeader });
  if (msg.bccHeader !== undefined) headers.push({ name: "Bcc", value: msg.bccHeader });

  return {
    id: msg.messageId,
    threadId,
    labelIds: [...msg.labelIds],
    snippet: msg.snippet,
    internalDate: String(msg.receivedAt.getTime()),
    payload: {
      mimeType: "text/plain",
      headers,
    },
  };
};

/** Decodes `users.threads.list` JSON to domain thread summaries. */
export const GmailThreadsListResponse = GmailThreadsListRaw.pipe(
  Schema.decodeTo(
    Schema.mutable(Schema.Array(GmailThreadSummary)),
    SchemaTransformation.transform({
      decode: (body) =>
        (body.threads ?? []).map((row) => ({
          threadId: row.id,
          snippet: row.snippet ?? "",
          historyId: row.historyId ?? "",
        })),
      encode: (summaries) => ({
        threads: summaries.map((s) => ({
          id: s.threadId,
          snippet: s.snippet,
          historyId: s.historyId,
        })),
      }),
    }),
  ),
);

/** Decodes a full-format `Thread` JSON resource to domain thread detail. */
export const GmailThreadDetailResponse = GmailThreadDetailRaw.pipe(
  Schema.decodeTo(
    GmailThreadDetail,
    SchemaTransformation.transform({
      decode: (body) => ({
        threadId: body.id,
        messages: (body.messages ?? []).map(threadMessageFromRaw),
      }),
      encode: (detail) => ({
        id: detail.threadId,
        messages: detail.messages.map((m) => threadMessageToRaw(m, detail.threadId)),
      }),
    }),
  ),
);
