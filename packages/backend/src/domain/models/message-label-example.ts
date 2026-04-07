import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { LabelId } from "#domain/models/label.ts";
import { MessageId } from "#domain/models/message.ts";

export const MessageLabelExampleId = Schema.String.check(Schema.isUUID()).pipe(
  Schema.brand("MessageLabelExampleId"),
);
export type MessageLabelExampleId = typeof MessageLabelExampleId.Type;

export class MessageLabelExample extends Model.Class<MessageLabelExample>("MessageLabelExample")({
  id: Model.GeneratedByApp(MessageLabelExampleId),
  labelId: LabelId,
  messageId: MessageId,
  createdAt: Model.DateTimeInsertFromDate,
}) {}
