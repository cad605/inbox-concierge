import { Schema } from "effect";

const MESSAGE = "Google authorization has expired. Sign in again to reconnect your inbox." as const;

export class InboxReauthorizationRequiredError extends Schema.TaggedErrorClass<InboxReauthorizationRequiredError>()(
  "InboxReauthorizationRequiredError",
  {},
  { httpApiStatus: 401 },
) {
  override get message(): string {
    return MESSAGE;
  }
}

export const isInboxReauthorizationRequiredError = Schema.is(InboxReauthorizationRequiredError);
