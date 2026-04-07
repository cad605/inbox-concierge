import { Schema } from "effect";

export const ProviderId = Schema.Trimmed.check(Schema.isNonEmpty()).pipe(
  Schema.brand("ProviderId"),
);
export type ProviderId = typeof ProviderId.Type;
