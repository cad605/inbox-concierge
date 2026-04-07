import { Schema } from "effect";

export class LabelAlreadyExistsError extends Schema.TaggedErrorClass<LabelAlreadyExistsError>()(
  "LabelAlreadyExistsError",
  { name: Schema.String },
  { httpApiStatus: 409 },
) {
  override get message(): string {
    return `A label named "${this.name}" already exists`;
  }
}

export const isLabelAlreadyExistsError = Schema.is(LabelAlreadyExistsError);
