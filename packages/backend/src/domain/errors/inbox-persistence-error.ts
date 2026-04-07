import { Schema } from "effect";

const MESSAGE = "A database error occurred while processing inbox data." as const;

export class InboxPersistenceError extends Schema.TaggedErrorClass<InboxPersistenceError>()(
  "InboxPersistenceError",
  { message: Schema.Literal(MESSAGE) },
  { httpApiStatus: 500 },
) {
  static fromError(_cause?: unknown): InboxPersistenceError {
    return new InboxPersistenceError({ message: MESSAGE });
  }
}

export const isInboxPersistenceError = Schema.is(InboxPersistenceError);
