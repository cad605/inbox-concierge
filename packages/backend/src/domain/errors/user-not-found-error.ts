import { Schema } from "effect";

export class UserNotFoundError extends Schema.TaggedErrorClass<UserNotFoundError>()(
  "UserNotFoundError",
  {},
  { httpApiStatus: 404 },
) {
  override get message(): string {
    return "User not found";
  }
}

export const isUserNotFoundError = Schema.is(UserNotFoundError);
