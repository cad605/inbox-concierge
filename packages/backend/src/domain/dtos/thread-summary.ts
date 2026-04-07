import { Schema } from "effect";

import { InboxParticipant } from "#domain/dtos/inbox-participant.ts";
import { ThreadId } from "#domain/models/thread.ts";

export class ThreadSummary extends Schema.Class<ThreadSummary>("ThreadSummary")({
  id: ThreadId,
  subject: Schema.String,
  snippet: Schema.String,
  participants: Schema.Array(InboxParticipant),
  lastMessageAt: Schema.DateTimeUtc,
  isUnread: Schema.Boolean,
  messageCount: Schema.Int,
}) {}
