import { Schema } from "effect";

export class LabelNotFoundError extends Schema.TaggedErrorClass<LabelNotFoundError>()(
  "LabelNotFoundError",
  {},
  { httpApiStatus: 404 },
) {
  override get message(): string {
    return "Label not found";
  }
}

export const isLabelNotFoundError = Schema.is(LabelNotFoundError);
