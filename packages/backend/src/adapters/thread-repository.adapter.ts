import { DateTime, Effect, Layer, Option, Schema } from "effect";
import { SqlClient, SqlSchema } from "effect/unstable/sql";

import { InboxParticipant } from "#domain/dtos/inbox-participant.ts";
import { InboxThreadLabel } from "#domain/dtos/inbox-thread-label.ts";
import { InboxThread } from "#domain/dtos/inbox-thread.ts";
import { MessageContent } from "#domain/dtos/message-content.ts";
import { InboxPersistenceError } from "#domain/errors/inbox-persistence-error.ts";
import { tapLogAndMapError } from "#domain/errors/tap-log-and-map-error.ts";
import { AuthUserId } from "#domain/models/auth-user.ts";
import { LabelId } from "#domain/models/label.ts";
import { MessageId } from "#domain/models/message.ts";
import { Thread, ThreadId } from "#domain/models/thread.ts";
import { Email } from "#domain/shared/email.ts";
import {
  ThreadRepository,
  type ListInboxThreadsPagination,
  type UpsertMessagesResult,
} from "#ports/thread-repository.port.ts";

/** Messages considered for auto-labeling match threads in this many latest-by-activity rows. */
const MESSAGE_CONTENT_THREAD_LIMIT = 200;

const MessageUpsertIdRow = Schema.Struct({
  id: MessageId,
  externalId: Schema.String,
});

/** Inbox thread row from the page query; `total` is the full thread count for the user (repeated on each row). */
const InboxThreadPageRow = Schema.Struct({
  id: ThreadId,
  subject: Schema.String,
  snippet: Schema.String,
  lastMessageAt: Schema.Date,
  messageCount: Schema.Int,
  isUnread: Schema.Boolean,
  lastMessageId: MessageId,
  total: Schema.Int,
});

const ParticipantRow = Schema.Struct({
  threadId: ThreadId,
  fromEmail: Email,
  fromName: Schema.NullOr(Schema.String),
});

const LabelAssignmentRow = Schema.Struct({
  threadId: ThreadId,
  labelId: LabelId,
  labelName: Schema.String,
});

const MessageContentRow = Schema.Struct({
  messageId: MessageId,
  threadId: ThreadId,
  subject: Schema.String,
  bodyText: Schema.String,
  snippet: Schema.String,
  fromName: Schema.NullOr(Schema.String),
  fromEmail: Email,
  toHeader: Schema.NullOr(Schema.String),
  ccHeader: Schema.NullOr(Schema.String),
  bccHeader: Schema.NullOr(Schema.String),
  receivedAt: Schema.Date,
});

const groupBy = <A>(
  items: ReadonlyArray<A>,
  key: (item: A) => string,
): Record<string, Array<A>> => {
  const result: Record<string, Array<A>> = {};
  for (const item of items) {
    const k = key(item);
    (result[k] ??= []).push(item);
  }
  return result;
};

const rowToMessageContent = (row: typeof MessageContentRow.Type): MessageContent =>
  MessageContent.makeUnsafe({
    messageId: row.messageId,
    threadId: row.threadId,
    subject: row.subject,
    bodyText: row.bodyText,
    snippet: row.snippet,
    fromName: Option.fromNullOr(row.fromName),
    fromEmail: row.fromEmail,
    toHeader: Option.fromNullOr(row.toHeader),
    ccHeader: Option.fromNullOr(row.ccHeader),
    bccHeader: Option.fromNullOr(row.bccHeader),
    receivedAt: DateTime.fromDateUnsafe(row.receivedAt),
  });

const make = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const upsertThread = Effect.fn("ThreadRepository.upsertThread")(
    function* (input: {
      readonly id: ThreadId;
      readonly userId: AuthUserId;
      readonly externalId: string;
      readonly subject: string;
      readonly snippet: string;
      readonly lastMessageAt: Date;
      readonly messageCount: number;
      readonly historyId: string;
    }) {
      const now = new Date();

      const rows = yield* sql`
			INSERT INTO threads ${sql.insert({
        id: input.id,
        userId: input.userId,
        externalId: input.externalId,
        subject: input.subject,
        snippet: input.snippet,
        lastMessageAt: input.lastMessageAt,
        messageCount: input.messageCount,
        historyId: input.historyId,
        createdAt: now,
        updatedAt: now,
      })}
			ON CONFLICT (user_id, external_id) DO UPDATE SET
				subject = EXCLUDED.subject,
				snippet = EXCLUDED.snippet,
				last_message_at = EXCLUDED.last_message_at,
				message_count = EXCLUDED.message_count,
				history_id = EXCLUDED.history_id,
				updated_at = NOW()
			RETURNING id, user_id, external_id, subject, snippet, last_message_at, message_count, history_id, created_at, updated_at
		`;

      if (rows.length === 0) {
        yield* Effect.logError("ThreadRepository.upsertThread: upsert returned no rows", {
          externalId: input.externalId,
        });
        return yield* Effect.fail(InboxPersistenceError.fromError());
      }

      return yield* Schema.decodeUnknownEffect(Thread)(rows[0]);
    },
    tapLogAndMapError("ThreadRepository.upsertThread", InboxPersistenceError.fromError),
  );

  const MessageExternalIdRow = Schema.Struct({
    externalId: Schema.String,
  });

  const findExistingMessageExternalIdsForThread = SqlSchema.findAll({
    Request: ThreadId,
    Result: MessageExternalIdRow,
    execute: (threadId) =>
      sql`SELECT m.external_id FROM messages m WHERE m.thread_id = ${threadId}`,
  });

  const upsertMessages = Effect.fn("ThreadRepository.upsertMessages")(
    function* (
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
    ) {
      const empty: UpsertMessagesResult = { messageIds: [], newMessageIds: [] };
      if (messages.length === 0) return yield* Effect.succeed(empty);

      const ownership = yield* sql`
        SELECT 1 AS ok FROM threads WHERE id = ${threadId} AND user_id = ${userId} LIMIT 1
      `;
      if (ownership.length === 0) {
        yield* Effect.logError("ThreadRepository.upsertMessages: thread not found for user", {
          threadId,
          userId,
        });
        return yield* Effect.fail(InboxPersistenceError.fromError());
      }

      const existingRows = yield* findExistingMessageExternalIdsForThread(threadId);
      const existingExternalIds = new Set(existingRows.map((r) => r.externalId));

      const createdAt = new Date();
      const rows = messages.map((msg) => ({
        id: crypto.randomUUID(),
        threadId,
        externalId: msg.externalId,
        subject: msg.subject,
        snippet: msg.snippet,
        bodyText: msg.bodyText,
        fromName: msg.fromName ?? null,
        fromEmail: msg.fromEmail,
        toHeader: msg.toHeader ?? null,
        ccHeader: msg.ccHeader ?? null,
        bccHeader: msg.bccHeader ?? null,
        receivedAt: msg.receivedAt,
        externalLabels: msg.externalLabels,
        createdAt,
      }));

      const inserted = yield* sql`
        INSERT INTO messages ${sql.insert(rows)}
        ON CONFLICT (thread_id, external_id) DO UPDATE SET
          subject = EXCLUDED.subject,
          snippet = EXCLUDED.snippet,
          body_text = EXCLUDED.body_text,
          from_name = EXCLUDED.from_name,
          from_email = EXCLUDED.from_email,
          to_header = EXCLUDED.to_header,
          cc_header = EXCLUDED.cc_header,
          bcc_header = EXCLUDED.bcc_header,
          received_at = EXCLUDED.received_at,
          external_labels = EXCLUDED.external_labels
        RETURNING id, external_id
      `;

      const currentExternalIds = messages.map((m) => m.externalId);
      yield* sql`
			DELETE FROM messages
			WHERE thread_id = ${threadId}
				AND NOT (external_id = ANY(${currentExternalIds}))
		`;

      const idByExternal = new Map<string, MessageId>();
      for (const raw of inserted) {
        const row = yield* Schema.decodeUnknownEffect(MessageUpsertIdRow)(raw);
        idByExternal.set(row.externalId, row.id);
      }

      const orderedIds: Array<MessageId> = [];
      for (const msg of messages) {
        const id = idByExternal.get(msg.externalId);
        if (id === undefined) {
          yield* Effect.logError("ThreadRepository.upsertMessages: missing id after upsert", {
            threadId,
            externalId: msg.externalId,
          });
          return yield* Effect.fail(InboxPersistenceError.fromError());
        }
        orderedIds.push(id);
      }

      const newMessageIds: Array<MessageId> = [];
      for (const msg of messages) {
        if (!existingExternalIds.has(msg.externalId)) {
          newMessageIds.push(idByExternal.get(msg.externalId)!);
        }
      }

      return { messageIds: orderedIds, newMessageIds };
    },
    tapLogAndMapError("ThreadRepository.upsertMessages", InboxPersistenceError.fromError),
  );

  const InboxThreadPageRequest = Schema.Struct({
    userId: AuthUserId,
    limit: Schema.Int,
    offset: Schema.Int,
  });

  const findInboxThreadRowsPage = SqlSchema.findAll({
    Request: InboxThreadPageRequest,
    Result: InboxThreadPageRow,
    execute: ({ userId, limit, offset }) =>
      sql`SELECT t.id, t.subject, t.snippet, t.last_message_at, t.message_count,
                 EXISTS(
                   SELECT 1 FROM messages m_unread
                   WHERE m_unread.thread_id = t.id AND 'UNREAD' = ANY(m_unread.external_labels)
                 ) AS is_unread,
                 lm.message_id AS last_message_id,
                 COUNT(*) OVER ()::int AS total
          FROM threads t
          INNER JOIN (
            SELECT DISTINCT ON (thread_id) id AS message_id, thread_id
            FROM messages
            ORDER BY thread_id, received_at DESC NULLS LAST, id DESC
          ) lm ON lm.thread_id = t.id
          WHERE t.user_id = ${userId}
          ORDER BY t.last_message_at DESC
          LIMIT ${limit} OFFSET ${offset}`,
  });

  const InboxThreadCountRow = Schema.Struct({
    count: Schema.Int,
  });

  const countInboxThreadRowsForUser = SqlSchema.findOne({
    Request: AuthUserId,
    Result: InboxThreadCountRow,
    execute: (userId) =>
      sql`SELECT COUNT(*)::int AS count
          FROM threads t
          WHERE t.user_id = ${userId}
            AND EXISTS (SELECT 1 FROM messages m WHERE m.thread_id = t.id)`,
  });

  const ParticipantsForThreadsRequest = Schema.Struct({
    userId: AuthUserId,
    threadIds: Schema.Array(ThreadId),
  });

  const findParticipantsByThreadIds = SqlSchema.findAll({
    Request: ParticipantsForThreadsRequest,
    Result: ParticipantRow,
    execute: ({ userId, threadIds }) =>
      sql`SELECT DISTINCT ON (m.thread_id, m.from_email)
                 t.id AS thread_id, m.from_email, m.from_name
          FROM messages m
          JOIN threads t ON t.id = m.thread_id
          WHERE t.user_id = ${userId}
            AND t.id = ANY(${threadIds})
          ORDER BY m.thread_id, m.from_email, m.received_at ASC`,
  });

  const LabelAssignmentsForThreadsRequest = Schema.Struct({
    userId: AuthUserId,
    threadIds: Schema.Array(ThreadId),
  });

  const findLabelAssignmentsByThreadIds = SqlSchema.findAll({
    Request: LabelAssignmentsForThreadsRequest,
    Result: LabelAssignmentRow,
    execute: ({ userId, threadIds }) =>
      sql`WITH relevant_messages AS (
              SELECT m.id AS message_id, m.thread_id
              FROM messages m
              JOIN threads t ON t.id = m.thread_id
              WHERE t.user_id = ${userId}
                AND t.id = ANY(${threadIds})
            ),
            latest_per_message AS (
              SELECT
                ml.message_id,
                ml.label_id,
                ml.classified_at,
                MAX(ml.classified_at) OVER (PARTITION BY ml.message_id) AS max_classified_at
              FROM message_labels ml
              INNER JOIN relevant_messages rm ON rm.message_id = ml.message_id
            )
            SELECT DISTINCT m.thread_id, lpm.label_id, l.name AS label_name
            FROM latest_per_message lpm
            JOIN messages m ON m.id = lpm.message_id
            JOIN labels l ON l.id = lpm.label_id
            WHERE lpm.classified_at = lpm.max_classified_at`,
  });

  const findMessageContentRowsByUserId = SqlSchema.findAll({
    Request: AuthUserId,
    Result: MessageContentRow,
    execute: (userId) =>
      sql`SELECT m.id AS message_id, m.thread_id, m.subject, m.body_text, m.snippet,
                 m.from_name, m.from_email, m.to_header, m.cc_header, m.bcc_header, m.received_at
          FROM messages m
          JOIN threads t ON t.id = m.thread_id
          WHERE t.user_id = ${userId}
            AND t.id IN (
              SELECT id FROM threads
              WHERE user_id = ${userId}
              ORDER BY last_message_at DESC
              LIMIT ${MESSAGE_CONTENT_THREAD_LIMIT}
            )
          ORDER BY t.last_message_at DESC, m.received_at ASC`,
  });

  const MessageIdForAutoLabelRow = Schema.Struct({
    messageId: MessageId,
  });

  const findMessageIdRowsForAutoLabelByUserId = SqlSchema.findAll({
    Request: AuthUserId,
    Result: MessageIdForAutoLabelRow,
    execute: (userId) =>
      sql`SELECT m.id AS message_id
          FROM messages m
          JOIN threads t ON t.id = m.thread_id
          WHERE t.user_id = ${userId}
            AND t.id IN (
              SELECT id FROM threads
              WHERE user_id = ${userId}
              ORDER BY last_message_at DESC
              LIMIT ${MESSAGE_CONTENT_THREAD_LIMIT}
            )
          ORDER BY t.last_message_at DESC, m.received_at ASC`,
  });

  const findMessageContentRowByUserAndMessageId = SqlSchema.findOneOption({
    Request: Schema.Struct({
      userId: AuthUserId,
      messageId: MessageId,
    }),
    Result: MessageContentRow,
    execute: ({ userId, messageId }) =>
      sql`SELECT m.id AS message_id, m.thread_id, m.subject, m.body_text, m.snippet,
                 m.from_name, m.from_email, m.to_header, m.cc_header, m.bcc_header, m.received_at
          FROM messages m
          JOIN threads t ON t.id = m.thread_id
          WHERE t.user_id = ${userId} AND m.id = ${messageId}
          LIMIT 1`,
  });

  const findInboxThreadsByUserId = Effect.fn("ThreadRepository.findInboxThreadsByUserId")(
    function* (userId: AuthUserId, pagination: ListInboxThreadsPagination) {
      const rows = yield* findInboxThreadRowsPage({
        userId,
        limit: pagination.limit,
        offset: pagination.offset,
      });

      const total =
        rows.length > 0 ? rows[0]!.total : (yield* countInboxThreadRowsForUser(userId)).count;

      const threadRows = rows.map(({ total: _total, ...thread }) => thread);

      const threadIds = threadRows.map((t) => t.id);

      const [participants, labelAssignments] =
        threadIds.length === 0
          ? [[], []]
          : yield* Effect.all([
              findParticipantsByThreadIds({ userId, threadIds }),
              findLabelAssignmentsByThreadIds({ userId, threadIds }),
            ]);

      const participantsByThread = groupBy(participants, (p) => p.threadId);
      const labelsByThread = groupBy(labelAssignments, (la) => la.threadId);

      const items = threadRows.map((thread) =>
        InboxThread.makeUnsafe({
          id: thread.id,
          subject: thread.subject,
          snippet: thread.snippet,
          lastMessageAt: DateTime.fromDateUnsafe(thread.lastMessageAt),
          messageCount: thread.messageCount,
          isUnread: thread.isUnread,
          lastMessageId: thread.lastMessageId,
          participants: (participantsByThread[thread.id] ?? []).map((p) =>
            InboxParticipant.makeUnsafe({
              name: Option.fromNullOr(p.fromName),
              email: p.fromEmail,
            }),
          ),
          labels: (labelsByThread[thread.id] ?? []).map((la) =>
            InboxThreadLabel.makeUnsafe({
              labelId: la.labelId,
              labelName: la.labelName,
            }),
          ),
        }),
      );

      return { items, total };
    },
    tapLogAndMapError("ThreadRepository.findInboxThreadsByUserId", InboxPersistenceError.fromError),
  );

  const findMessageContentByUserId = Effect.fn("ThreadRepository.findMessageContentByUserId")(
    function* (userId: AuthUserId) {
      const rows = yield* findMessageContentRowsByUserId(userId);
      return rows.map(rowToMessageContent);
    },
    tapLogAndMapError(
      "ThreadRepository.findMessageContentByUserId",
      InboxPersistenceError.fromError,
    ),
  );

  const findMessageContentByUserAndMessageId = Effect.fn(
    "ThreadRepository.findMessageContentByUserAndMessageId",
  )(
    function* (userId: AuthUserId, messageId: MessageId) {
      const row = yield* findMessageContentRowByUserAndMessageId({ userId, messageId });
      return Option.map(row, rowToMessageContent);
    },
    tapLogAndMapError(
      "ThreadRepository.findMessageContentByUserAndMessageId",
      InboxPersistenceError.fromError,
    ),
  );

  const findMessageIdsForAutoLabelByUserId = Effect.fn(
    "ThreadRepository.findMessageIdsForAutoLabelByUserId",
  )(
    function* (userId: AuthUserId) {
      const rows = yield* findMessageIdRowsForAutoLabelByUserId(userId);
      return rows.map((r) => r.messageId);
    },
    tapLogAndMapError(
      "ThreadRepository.findMessageIdsForAutoLabelByUserId",
      InboxPersistenceError.fromError,
    ),
  );

  return ThreadRepository.of({
    upsertThread,
    upsertMessages,
    findInboxThreadsByUserId,
    findMessageContentByUserId,
    findMessageContentByUserAndMessageId,
    findMessageIdsForAutoLabelByUserId,
  });
});

export const ThreadRepositoryLive = Layer.effect(ThreadRepository, make);
