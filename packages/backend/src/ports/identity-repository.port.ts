import { type Effect, type Option, ServiceMap } from "effect";

import type { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import type { AuthIdentityId, AuthIdentity } from "#domain/models/auth-identity.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import type { ProviderId } from "#domain/shared/provider-id.ts";

export class IdentityRepository extends ServiceMap.Service<
  IdentityRepository,
  {
    readonly findByProvider: (
      provider: AuthProviderType,
      providerId: ProviderId,
    ) => Effect.Effect<Option.Option<AuthIdentity>, AuthPersistenceError>;

    readonly findByUserIdAndProvider: (
      userId: AuthUserId,
      provider: AuthProviderType,
    ) => Effect.Effect<Option.Option<AuthIdentity>, AuthPersistenceError>;

    readonly create: (input: {
      readonly id: AuthIdentityId;
      readonly userId: AuthUserId;
      readonly provider: AuthProviderType;
      readonly providerId: ProviderId;
      readonly providerData: Option.Option<unknown>;
    }) => Effect.Effect<AuthIdentity, AuthPersistenceError>;
  }
>()("app/ports/IdentityRepository") {}
