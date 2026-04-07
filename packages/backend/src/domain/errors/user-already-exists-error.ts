import { Schema } from "effect";

export class UserAlreadyExistsError extends Schema.TaggedErrorClass<UserAlreadyExistsError>()(
  "UserAlreadyExistsError",
  {},
  { httpApiStatus: 409 },
) {
  override get message(): string {
    return "User already exists";
  }
}

export const isUserAlreadyExistsError = Schema.is(UserAlreadyExistsError);
