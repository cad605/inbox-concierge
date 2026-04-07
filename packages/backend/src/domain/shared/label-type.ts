import { Schema } from "effect";

export const LabelType = Schema.Literals(["system", "custom"]);
export type LabelType = typeof LabelType.Type;
