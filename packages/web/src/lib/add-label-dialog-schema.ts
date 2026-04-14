import { m } from "$paraglide/messages.js";
import { Schema, SchemaGetter } from "effect";

const addLabelNameNonEmpty = Schema.makeFilter(
  (s: string) => s.length > 0 || m.validation_field_required(),
);

export const addLabelNameSchema = Schema.String.pipe(
  Schema.decode({
    decode: SchemaGetter.transform((s: string) => s.trim()),
    encode: SchemaGetter.transform((s: string) => s.trim()),
  }),
).check(addLabelNameNonEmpty);

export const addLabelFormSchema = Schema.Struct({
  name: addLabelNameSchema,
  prompt: Schema.String,
});

export const addLabelFormStandardSchema = Schema.toStandardSchemaV1(addLabelFormSchema);

export type ExampleSelection = {
  readonly messageId: string;
};

/** Keep in sync with `MAX_LABEL_EXAMPLES_PER_LABEL` in the backend (`domain/constants/label-examples.ts`). */
export const MAX_LABEL_EXAMPLES_PER_LABEL = 5;

/** Matches `addLabelNameSchema` (trim + non-empty). */
export function isAddLabelNameValid(name: string): boolean {
  return name.trim().length > 0;
}
