import { type Effect, type Option, ServiceMap } from "effect";

import type { LabelNotFoundError } from "#domain/errors/label-not-found-error.ts";
import type { LabelPersistenceError } from "#domain/errors/label-persistence-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { Label, LabelId } from "#domain/models/label.ts";
import type { MessageLabelExampleId } from "#domain/models/message-label-example.ts";
import type { MessageId } from "#domain/models/message.ts";
import type { LabelType } from "#domain/shared/label-type.ts";

export class LabelRepository extends ServiceMap.Service<
  LabelRepository,
  {
    readonly findByIdForUser: (
      userId: AuthUserId,
      id: LabelId,
    ) => Effect.Effect<Option.Option<Label>, LabelPersistenceError>;

    readonly findByUserId: (
      userId: AuthUserId,
      options?: { readonly activeOnly?: boolean },
    ) => Effect.Effect<ReadonlyArray<Label>, LabelPersistenceError>;

    readonly findByUserIdAndName: (
      userId: AuthUserId,
      name: string,
    ) => Effect.Effect<Option.Option<Label>, LabelPersistenceError>;

    readonly create: (input: {
      readonly id: LabelId;
      readonly userId: AuthUserId;
      readonly name: string;
      readonly prompt?: string | undefined;
      readonly type: LabelType;
      readonly examples?: ReadonlyArray<{
        readonly id: MessageLabelExampleId;
        readonly messageId: MessageId;
      }>;
    }) => Effect.Effect<Label, LabelPersistenceError>;

    readonly update: (
      userId: AuthUserId,
      id: LabelId,
      input: { readonly isActive: boolean },
    ) => Effect.Effect<Label, LabelNotFoundError | LabelPersistenceError>;
  }
>()("app/ports/LabelRepository") {}
