import { Schema } from "effect";

export class PermissionDeniedError extends Schema.TaggedErrorClass<PermissionDeniedError>()(
  "PermissionDeniedError",
  {},
  { httpApiStatus: 403 },
) {
  override get message(): string {
    return "Permission denied";
  }
}

export const isPermissionDeniedError = Schema.is(PermissionDeniedError);
