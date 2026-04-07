import { Schema } from "effect";

export class SessionExpiredError extends Schema.TaggedErrorClass<SessionExpiredError>()(
  "SessionExpiredError",
  {},
  { httpApiStatus: 401 },
) {
  override get message(): string {
    return "Session has expired";
  }
}

export const isSessionExpiredError = Schema.is(SessionExpiredError);
