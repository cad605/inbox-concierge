import { Schema } from "effect";

import { InboxParticipant } from "#domain/dtos/inbox-participant.ts";
import { InboxThreadLabel } from "#domain/dtos/inbox-thread-label.ts";
import { MessageId } from "#domain/models/message.ts";
import { ThreadId } from "#domain/models/thread.ts";

export class InboxThread extends Schema.Class<InboxThread>("InboxThread")({
  id: ThreadId,
  subject: Schema.String,
  snippet: Schema.String,
  lastMessageAt: Schema.DateTimeUtc,
  messageCount: Schema.Int,
  isUnread: Schema.Boolean,
  /** Latest message in the thread; used to attach few-shot label examples. Always set for listed threads (only threads with messages are returned). */
  lastMessageId: MessageId,
  participants: Schema.Array(InboxParticipant),
  labels: Schema.Array(InboxThreadLabel),
}) {}
