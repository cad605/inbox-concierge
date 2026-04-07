import { Schema } from "effect";

const MESSAGE = "A database error occurred while processing authentication data." as const;

export class AuthPersistenceError extends Schema.TaggedErrorClass<AuthPersistenceError>()(
  "AuthPersistenceError",
  { message: Schema.Literal(MESSAGE) },
  { httpApiStatus: 500 },
) {
  static fromError(_cause?: unknown): AuthPersistenceError {
    return new AuthPersistenceError({ message: MESSAGE });
  }
}

export const isAuthPersistenceError = Schema.is(AuthPersistenceError);
