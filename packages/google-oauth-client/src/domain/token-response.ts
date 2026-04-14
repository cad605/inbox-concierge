import { Schema } from "effect";

/** JSON body from `https://oauth2.googleapis.com/token`. */
export const GoogleTokenResponse = Schema.Struct({
  access_token: Schema.String,
  refresh_token: Schema.optional(Schema.String),
  expires_in: Schema.Number,
  token_type: Schema.String,
  scope: Schema.String,
  id_token: Schema.optional(Schema.String),
  /** Present when the user grants time-based access (Google token response). */
  refresh_token_expires_in: Schema.optional(Schema.Number),
});

export type GoogleTokenResponse = typeof GoogleTokenResponse.Type;
