import { type Effect, ServiceMap } from "effect";

import type { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import type { LabelId } from "#domain/models/label.ts";
import type { MessageLabelExample } from "#domain/models/message-label-example.ts";

export class MessageLabelExampleRepository extends ServiceMap.Service<
  MessageLabelExampleRepository,
  {
    readonly findByLabelId: (
      labelId: LabelId,
    ) => Effect.Effect<ReadonlyArray<MessageLabelExample>, LabelPersistenceError>;

    readonly findByLabelIds: (
      labelIds: ReadonlyArray<LabelId>,
    ) => Effect.Effect<ReadonlyArray<MessageLabelExample>, LabelPersistenceError>;
  }
>()("app/ports/MessageLabelExampleRepository") {}
