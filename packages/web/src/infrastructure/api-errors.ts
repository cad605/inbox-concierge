import { m } from "$paraglide/messages.js";

export const hasMessage = (error: unknown): error is { message: string } =>
  typeof error === "object" &&
  error !== null &&
  "message" in error &&
  typeof (error as { message: unknown }).message === "string";

const isPermissionDeniedError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "_tag" in error &&
  (error as { readonly _tag?: unknown })._tag === "PermissionDeniedError";

export const getErrorMessage = (error: unknown): string => {
  if (isPermissionDeniedError(error)) {
    return m.api_error_permission_denied();
  }
  return hasMessage(error) ? error.message : m.api_error_generic();
};
