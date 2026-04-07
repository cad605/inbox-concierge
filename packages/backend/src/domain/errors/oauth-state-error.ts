import { Schema } from "effect";

export class OAuthStateError extends Schema.TaggedErrorClass<OAuthStateError>()(
  "OAuthStateError",
  {},
  { httpApiStatus: 400 },
) {
  override get message(): string {
    return "OAuth state mismatch or missing";
  }
}

export const isOAuthStateError = Schema.is(OAuthStateError);
