import { Schema } from "effect";

export class SessionNotFoundError extends Schema.TaggedErrorClass<SessionNotFoundError>()(
  "SessionNotFoundError",
  {},
  { httpApiStatus: 401 },
) {
  override get message(): string {
    return "Session not found or invalid";
  }
}

export const isSessionNotFoundError = Schema.is(SessionNotFoundError);
