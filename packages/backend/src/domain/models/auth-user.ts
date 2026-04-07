import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import { Email } from "#domain/shared/email.ts";
import { UserRole } from "#domain/shared/user-role.ts";

export const AuthUserId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("AuthUserId"));
export type AuthUserId = typeof AuthUserId.Type;

export class AuthUser extends Model.Class<AuthUser>("AuthUser")({
  id: Model.GeneratedByApp(AuthUserId),
  email: Email,
  displayName: Schema.Trimmed.check(Schema.isNonEmpty()),
  role: UserRole,
  primaryProvider: AuthProviderType,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
}) {}
