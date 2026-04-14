import { Schema } from "effect";

import { GoogleOAuthOperation } from "#domain/operation.ts";

export class GoogleOAuthApiError extends Schema.TaggedErrorClass<GoogleOAuthApiError>()(
  "GoogleOAuthApiError",
  {
    /** Which high-level operation failed */
    operation: GoogleOAuthOperation,
    endpoint: Schema.String,
    statusCode: Schema.Number,
    error: Schema.Defect,
  },
) {}

export const isGoogleOAuthApiError = Schema.is(GoogleOAuthApiError);

export class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
  statusCode: Schema.UndefinedOr(Schema.Number),
  message: Schema.String,
}) {}

export const isHttpError = Schema.is(HttpError);

export class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
  message: Schema.String,
}) {}

export const isValidationError = Schema.is(ValidationError);
