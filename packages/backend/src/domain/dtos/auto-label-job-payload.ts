import { Schema } from "effect";

import { AuthUserId } from "#domain/models/auth-user.ts";
import { MessageId } from "#domain/models/message.ts";

export class AutoLabelJobPayload extends Schema.Class<AutoLabelJobPayload>("AutoLabelJobPayload")({
  userId: AuthUserId,
  messageId: MessageId,
}) {}
