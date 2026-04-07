import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { AuthUserId } from "#domain/models/auth-user.ts";

export const ThreadId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("ThreadId"));
export type ThreadId = typeof ThreadId.Type;

export class Thread extends Model.Class<Thread>("Thread")({
  id: Model.GeneratedByApp(ThreadId),
  userId: AuthUserId,
  externalId: Schema.String,
  subject: Schema.String,
  snippet: Schema.String,
  lastMessageAt: Schema.DateTimeUtcFromDate,
  messageCount: Schema.Int,
  historyId: Schema.String,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
}) {}
