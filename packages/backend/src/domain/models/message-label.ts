import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { LabelId } from "#domain/models/label.ts";
import { MessageId } from "#domain/models/message.ts";

export class MessageLabel extends Model.Class<MessageLabel>("MessageLabel")({
  messageId: MessageId,
  labelId: LabelId,
  jobId: Schema.String,
  classifiedAt: Schema.DateTimeUtcFromDate,
}) {}
