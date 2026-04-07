import { Schema } from "effect";
import { Model } from "effect/unstable/schema";

import { AuthUserId } from "#domain/models/auth-user.ts";
import { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import { ProviderId } from "#domain/shared/provider-id.ts";

export const AuthIdentityId = Schema.String.check(Schema.isUUID()).pipe(
  Schema.brand("AuthIdentityId"),
);
export type AuthIdentityId = typeof AuthIdentityId.Type;

export class AuthIdentity extends Model.Class<AuthIdentity>("UserIdentity")({
  id: Model.GeneratedByApp(AuthIdentityId),
  userId: AuthUserId,
  provider: AuthProviderType,
  providerId: ProviderId,
  providerData: Model.FieldOption(Schema.Unknown),
  createdAt: Model.DateTimeInsertFromDate,
}) {}
