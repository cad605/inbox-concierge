import { Schema } from "effect";

/** JSON body from Google userinfo. */
export const GoogleUserInfo = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  verified_email: Schema.Boolean,
  name: Schema.optional(Schema.String),
  given_name: Schema.optional(Schema.String),
  family_name: Schema.optional(Schema.String),
  picture: Schema.optional(Schema.String),
});

export type GoogleUserInfo = typeof GoogleUserInfo.Type;
