import { type Effect, ServiceMap } from "effect";

import type { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import type { LabelId } from "#domain/models/label.ts";
import type { MessageId } from "#domain/models/message.ts";

export class MessageLabelRepository extends ServiceMap.Service<
  MessageLabelRepository,
  {
    readonly upsertMany: (
      inputs: ReadonlyArray<{
        readonly messageId: MessageId;
        readonly labelId: LabelId;
        readonly jobId: string;
      }>,
    ) => Effect.Effect<void, LabelPersistenceError>;
  }
>()("app/ports/MessageLabelRepository") {}
