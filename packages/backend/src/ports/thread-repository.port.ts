import { type Effect, type Option, ServiceMap } from "effect";

import type { InboxThread } from "#domain/dtos/inbox-thread.ts";
import type { MessageContent } from "#domain/dtos/message-content.ts";
import type { InboxPersistenceError } from "#domain/errors/inbox-persistence-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { MessageId } from "#domain/models/message.ts";
import type { Thread, ThreadId } from "#domain/models/thread.ts";

/** Pagination for inbox thread list; aligns with TanStack DB `limit` / `offset` subset loading. */
export type ListInboxThreadsPagination = {
  readonly limit: number;
  readonly offset: number;
};

export type UpsertMessagesResult = {
  readonly messageIds: ReadonlyArray<MessageId>;
  readonly newMessageIds: ReadonlyArray<MessageId>;
};

export class ThreadRepository extends ServiceMap.Service<
  ThreadRepository,
  {
    readonly upsertThread: (input: {
      readonly id: ThreadId;
      readonly userId: AuthUserId;
      readonly externalId: string;
      readonly subject: string;
      readonly snippet: string;
      readonly lastMessageAt: Date;
      readonly messageCount: number;
      readonly historyId: string;
    }) => Effect.Effect<Thread, InboxPersistenceError>;

    readonly upsertMessages: (
      userId: AuthUserId,
      threadId: ThreadId,
      messages: ReadonlyArray<{
        readonly externalId: string;
        readonly subject: string;
        readonly snippet: string;
        readonly bodyText: string;
        readonly fromName?: string | undefined;
        readonly fromEmail: string;
        readonly toHeader?: string | undefined;
        readonly ccHeader?: string | undefined;
        readonly bccHeader?: string | undefined;
        readonly receivedAt: Date;
        readonly externalLabels: ReadonlyArray<string>;
      }>,
    ) => Effect.Effect<UpsertMessagesResult, InboxPersistenceError>;

    readonly findMessageContentByUserAndMessageId: (
      userId: AuthUserId,
      messageId: MessageId,
    ) => Effect.Effect<Option.Option<MessageContent>, InboxPersistenceError>;

    readonly findMessageIdsForAutoLabelByUserId: (
      userId: AuthUserId,
    ) => Effect.Effect<ReadonlyArray<MessageId>, InboxPersistenceError>;

    readonly findInboxThreadsByUserId: (
      userId: AuthUserId,
      pagination: ListInboxThreadsPagination,
    ) => Effect.Effect<
      { readonly items: ReadonlyArray<InboxThread>; readonly total: number },
      InboxPersistenceError
    >;

    readonly findMessageContentByUserId: (
      userId: AuthUserId,
    ) => Effect.Effect<ReadonlyArray<MessageContent>, InboxPersistenceError>;
  }
>()("app/ports/ThreadRepository") {}
