import { Schema } from "effect";

export class AutoLabelError extends Schema.TaggedErrorClass<AutoLabelError>()(
  "AutoLabelError",
  {
    message: Schema.String,
    cause: Schema.Defect,
  },
  { httpApiStatus: 500 },
) {
  static fromError(error: unknown): AutoLabelError {
    return new AutoLabelError({
      message: error instanceof Error ? error.message : String(error),
      cause: error,
    });
  }
}

export const isAutoLabelError = Schema.is(AutoLabelError);
