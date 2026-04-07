import { Schema } from "effect";

import { OAuthTokenData } from "#domain/dtos/oauth-token-data.ts";
import { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import { Email } from "#domain/shared/email.ts";
import { ProviderId } from "#domain/shared/provider-id.ts";

export class AuthResult extends Schema.Class<AuthResult>("AuthResult")({
  provider: AuthProviderType,
  providerId: ProviderId,
  email: Email,
  displayName: Schema.String,
  emailVerified: Schema.Boolean,
  providerData: Schema.Option(Schema.Unknown),
  tokenData: Schema.Option(OAuthTokenData),
}) {}
