import { DateTime, Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { AuthIdentityId } from "#domain/models/auth-identity.ts";

export const OAuthTokenId = Schema.String.check(Schema.isUUID()).pipe(Schema.brand("OAuthTokenId"));
export type OAuthTokenId = typeof OAuthTokenId.Type;

export class OAuthToken extends Model.Class<OAuthToken>("OAuthToken")({
  id: Model.GeneratedByApp(OAuthTokenId),
  identityId: AuthIdentityId,
  accessToken: Model.Sensitive(Schema.Redacted(Schema.String)),
  refreshToken: Model.FieldOption(Schema.Redacted(Schema.String)),
  tokenType: Schema.String,
  scopes: Schema.String,
  expiresAt: Schema.DateTimeUtcFromDate,
  createdAt: Model.DateTimeInsertFromDate,
  updatedAt: Model.DateTimeUpdateFromDate,
}) {
  isExpired(now: DateTime.Utc): boolean {
    return DateTime.isLessThanOrEqualTo(this.expiresAt, now);
  }
}
