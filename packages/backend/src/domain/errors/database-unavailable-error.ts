import { Schema } from "effect";

export const DATABASE_UNAVAILABLE_MESSAGE = "Service temporarily unavailable." as const;

export class DatabaseUnavailableError extends Schema.TaggedErrorClass<DatabaseUnavailableError>()(
  "DatabaseUnavailableError",
  { message: Schema.Literal(DATABASE_UNAVAILABLE_MESSAGE) },
  { httpApiStatus: 503 },
) {}

export const makeDatabaseUnavailableError = (): DatabaseUnavailableError =>
  new DatabaseUnavailableError({ message: DATABASE_UNAVAILABLE_MESSAGE });

export const isDatabaseUnavailableError = Schema.is(DatabaseUnavailableError);
