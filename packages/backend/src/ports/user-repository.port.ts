import { type Effect, type Option, ServiceMap } from "effect";

import type { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import type { AuthUser, AuthUserId } from "#domain/models/auth-user.ts";
import type { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import type { Email } from "#domain/shared/email.ts";
import type { UserRole } from "#domain/shared/user-role.ts";

export class UserRepository extends ServiceMap.Service<
  UserRepository,
  {
    readonly findById: (
      id: AuthUserId,
    ) => Effect.Effect<Option.Option<AuthUser>, AuthPersistenceError>;

    readonly findByEmail: (
      email: Email,
    ) => Effect.Effect<Option.Option<AuthUser>, AuthPersistenceError>;

    readonly create: (input: {
      readonly id: AuthUserId;
      readonly email: Email;
      readonly displayName: string;
      readonly role: UserRole;
      readonly primaryProvider: AuthProviderType;
    }) => Effect.Effect<AuthUser, AuthPersistenceError>;
  }
>()("app/ports/UserRepository") {}
