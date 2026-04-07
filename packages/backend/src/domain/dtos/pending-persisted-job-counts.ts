import { Schema } from "effect";

/** Counts of durable queue rows still eligible for processing for one user (by queue). */
export class PendingPersistedJobCounts extends Schema.Class<PendingPersistedJobCounts>(
  "PendingPersistedJobCounts",
)({
  userInboxSyncCount: Schema.Int,
  messageAutoLabelCount: Schema.Int,
}) {}
