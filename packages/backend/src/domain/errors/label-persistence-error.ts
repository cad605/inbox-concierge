import { Schema } from "effect";

const MESSAGE = "A database error occurred while processing labels." as const;

export class LabelPersistenceError extends Schema.TaggedErrorClass<LabelPersistenceError>()(
  "LabelPersistenceError",
  { message: Schema.Literal(MESSAGE) },
  { httpApiStatus: 500 },
) {
  static fromError(_cause?: unknown): LabelPersistenceError {
    return new LabelPersistenceError({ message: MESSAGE });
  }
}

export const isLabelPersistenceError = Schema.is(LabelPersistenceError);
