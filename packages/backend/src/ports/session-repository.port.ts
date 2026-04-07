import { type DateTime, type Effect, type Option, ServiceMap } from "effect";

import type { AuthPersistenceError } from "#domain/errors/auth-persistence-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { AuthSessionId, Session } from "#domain/models/session.ts";
import type { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import type { UserAgent } from "#domain/shared/user-agent.ts";

export class SessionRepository extends ServiceMap.Service<
  SessionRepository,
  {
    readonly findById: (
      id: AuthSessionId,
    ) => Effect.Effect<Option.Option<Session>, AuthPersistenceError>;

    readonly create: (input: {
      readonly id: AuthSessionId;
      readonly userId: AuthUserId;
      readonly provider: AuthProviderType;
      readonly expiresAt: DateTime.Utc;
      readonly userAgent: Option.Option<UserAgent>;
      readonly ipAddress: Option.Option<string>;
    }) => Effect.Effect<Session, AuthPersistenceError>;

    readonly delete: (id: AuthSessionId) => Effect.Effect<void, AuthPersistenceError>;
  }
>()("app/ports/SessionRepository") {}
