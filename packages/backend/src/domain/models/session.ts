import { DateTime, Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { AuthUserId } from "#domain/models/auth-user.ts";
import { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import { UserAgent } from "#domain/shared/user-agent.ts";

export const AuthSessionId = Schema.Trimmed.check(Schema.isMinLength(32)).pipe(
  Schema.brand("AuthSessionId"),
);
export type AuthSessionId = typeof AuthSessionId.Type;

export class Session extends Model.Class<Session>("Session")({
  id: Model.GeneratedByApp(AuthSessionId),
  userId: AuthUserId,
  provider: AuthProviderType,
  expiresAt: Schema.DateTimeUtcFromDate,
  createdAt: Model.DateTimeInsertFromDate,
  userAgent: Model.FieldOption(UserAgent),
  ipAddress: Model.FieldOption(Schema.String.check(Schema.isMaxLength(45))),
}) {
  isExpired(now: DateTime.Utc): boolean {
    return DateTime.isLessThanOrEqualTo(this.expiresAt, now);
  }
}
