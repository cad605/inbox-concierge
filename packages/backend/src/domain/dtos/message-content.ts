import { Schema } from "effect";

import { MessageId } from "#domain/models/message.ts";
import { ThreadId } from "#domain/models/thread.ts";
import { Email } from "#domain/shared/email.ts";

export class MessageContent extends Schema.Class<MessageContent>("MessageContent")({
  messageId: MessageId,
  threadId: ThreadId,
  subject: Schema.String,
  bodyText: Schema.String,
  snippet: Schema.String,
  fromName: Schema.Option(Schema.String),
  fromEmail: Email,
  toHeader: Schema.Option(Schema.String),
  ccHeader: Schema.Option(Schema.String),
  bccHeader: Schema.Option(Schema.String),
  receivedAt: Schema.DateTimeUtc,
}) {}
