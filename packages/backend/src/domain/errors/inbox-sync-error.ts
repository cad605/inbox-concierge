import { Schema } from "effect";

const MESSAGE = "Inbox synchronization failed." as const;

export class InboxSyncError extends Schema.TaggedErrorClass<InboxSyncError>()(
  "InboxSyncError",
  { message: Schema.Literal(MESSAGE) },
  { httpApiStatus: 502 },
) {
  static fromError(_cause?: unknown): InboxSyncError {
    return new InboxSyncError({ message: MESSAGE });
  }
}

export const isInboxSyncError = Schema.is(InboxSyncError);
