import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { ThreadId } from "#domain/models/thread.ts";
import { Email } from "#domain/shared/email.ts";

export const MessageId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("MessageId"));
export type MessageId = typeof MessageId.Type;

export class Message extends Model.Class<Message>("Message")({
  id: Model.GeneratedByApp(MessageId),
  threadId: ThreadId,
  externalId: Schema.String,
  subject: Schema.String,
  snippet: Schema.String,
  bodyText: Schema.String,
  fromName: Model.FieldOption(Schema.String),
  fromEmail: Email,
  toHeader: Model.FieldOption(Schema.String),
  ccHeader: Model.FieldOption(Schema.String),
  bccHeader: Model.FieldOption(Schema.String),
  receivedAt: Schema.DateTimeUtcFromDate,
  externalLabels: Schema.Array(Schema.String),
  createdAt: Model.DateTimeInsertFromDate,
}) {}
