import { Schema } from "effect";

import { AuthUserId } from "#domain/models/auth-user.ts";

export class InboxSyncJobPayload extends Schema.Class<InboxSyncJobPayload>("InboxSyncJobPayload")({
  userId: AuthUserId,
}) {}
