import { Schema } from "effect";

export class OAuthTokenData extends Schema.Class<OAuthTokenData>("OAuthTokenData")({
  accessToken: Schema.String,
  refreshToken: Schema.Option(Schema.String),
  expiresIn: Schema.Number,
  tokenType: Schema.String,
  scopes: Schema.String,
}) {}
