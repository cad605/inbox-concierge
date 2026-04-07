import { Schema } from "effect";

export class ProviderNotEnabledError extends Schema.TaggedErrorClass<ProviderNotEnabledError>()(
  "ProviderNotEnabledError",
  {},
  { httpApiStatus: 404 },
) {
  override get message(): string {
    return "Authentication provider is not enabled";
  }
}

export const isProviderNotEnabledError = Schema.is(ProviderNotEnabledError);
