import { type Effect, ServiceMap } from "effect";

import type { AutoLabelResult } from "#domain/dtos/auto-label-result.ts";
import type { MessageContent } from "#domain/dtos/message-content.ts";
import type { AutoLabelError } from "#domain/errors/auto-label-error.ts";
import type { Label } from "#domain/models/label.ts";
import type { MessageLabelExample } from "#domain/models/message-label-example.ts";

export class MessageAutoLabeler extends ServiceMap.Service<
  MessageAutoLabeler,
  {
    readonly autoLabelMessage: (input: {
      readonly message: MessageContent;
      readonly labels: ReadonlyArray<Label>;
      readonly examples: ReadonlyArray<MessageLabelExample>;
    }) => Effect.Effect<AutoLabelResult, AutoLabelError>;
  }
>()("app/ports/MessageAutoLabeler") {}
