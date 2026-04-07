import { Schema } from "effect";

export class OAuthTokenExpiredError extends Schema.TaggedErrorClass<OAuthTokenExpiredError>()(
  "OAuthTokenExpiredError",
  {},
  { httpApiStatus: 401 },
) {
  override get message(): string {
    return "OAuth token has expired";
  }
}

export const isOAuthTokenExpiredError = Schema.is(OAuthTokenExpiredError);
