import { Schema } from "effect";

import { MessageId } from "#domain/models/message.ts";

export class AutoLabelResult extends Schema.Class<AutoLabelResult>("AutoLabelResult")({
  messageId: MessageId,
  labelNames: Schema.Array(Schema.String),
}) {}
