import { Schema } from "effect";

export class TokenEncryptionError extends Schema.TaggedErrorClass<TokenEncryptionError>()(
  "TokenEncryptionError",
  {
    message: Schema.String,
    cause: Schema.Defect,
  },
  { httpApiStatus: 500 },
) {}

export const isTokenEncryptionError = Schema.is(TokenEncryptionError);
