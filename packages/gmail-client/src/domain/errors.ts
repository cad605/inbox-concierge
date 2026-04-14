import { Schema } from "effect";

export class GmailApiError extends Schema.TaggedErrorClass<GmailApiError>()("GmailApiError", {
  endpoint: Schema.String,
  statusCode: Schema.Number,
  error: Schema.Defect,
}) {}

export const isGmailApiError = Schema.is(GmailApiError);

export class HttpError extends Schema.TaggedErrorClass("HttpError")("HttpError", {
  statusCode: Schema.UndefinedOr(Schema.Number),
  message: Schema.String,
}) {}

export const isHttpError = Schema.is(HttpError);

export class ValidationError extends Schema.TaggedErrorClass("ValidationError")("ValidationError", {
  message: Schema.String,
}) {}

export const isValidationError = Schema.is(ValidationError);
