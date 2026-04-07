import { Schema } from "effect";

export class ProviderAuthFailedError extends Schema.TaggedErrorClass<ProviderAuthFailedError>()(
  "ProviderAuthFailedError",
  { reason: Schema.String },
  { httpApiStatus: 401 },
) {
  override get message(): string {
    return this.reason;
  }
}

export const isProviderAuthFailedError = Schema.is(ProviderAuthFailedError);
