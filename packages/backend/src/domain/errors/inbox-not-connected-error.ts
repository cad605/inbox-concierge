import { Schema } from "effect";

export class InboxNotConnectedError extends Schema.TaggedErrorClass<InboxNotConnectedError>()(
  "InboxNotConnectedError",
  {},
  { httpApiStatus: 400 },
) {
  override get message(): string {
    return "Inbox is not connected for this account";
  }
}

export const isInboxNotConnectedError = Schema.is(InboxNotConnectedError);
