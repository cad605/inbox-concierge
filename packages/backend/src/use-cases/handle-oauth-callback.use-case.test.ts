import { describe, expect, layer } from "@effect/vitest";
import { Cause, DateTime, Effect, Exit, Layer, Option } from "effect";

import { AuthResult } from "#domain/dtos/auth-result.ts";
import { isProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";
import { AuthIdentity, AuthIdentityId } from "#domain/models/auth-identity.ts";
import { AuthUser, AuthUserId } from "#domain/models/auth-user.ts";
import { Session, AuthSessionId } from "#domain/models/session.ts";
import { Email } from "#domain/shared/email.ts";
import { ProviderId } from "#domain/shared/provider-id.ts";
import { AuthProvider } from "#ports/auth-provider.port.ts";
import { GenerateSessionToken } from "#ports/generate-session-token.port.ts";
import { IdentityRepository } from "#ports/identity-repository.port.ts";
import { OAuthTokenRepository } from "#ports/oauth-token-repository.port.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";
import { UserRepository } from "#ports/user-repository.port.ts";
import { handleOAuthCallback } from "#use-cases/handle-oauth-callback.use-case.ts";

const now = DateTime.fromDateUnsafe(new Date());

const userId = AuthUserId.makeUnsafe("550e8400-e29b-41d4-a716-446655440001");
const identityId = AuthIdentityId.makeUnsafe("550e8400-e29b-41d4-a716-446655440002");
const sessionId = AuthSessionId.makeUnsafe("01234567890123456789012345678901");

const email = Email.makeUnsafe("oauth-user@example.com");
const providerId = ProviderId.makeUnsafe("google-sub-stable");

const authResult = AuthResult.makeUnsafe({
  provider: "google",
  providerId,
  email,
  displayName: "OAuth User",
  emailVerified: true,
  providerData: Option.none(),
  tokenData: Option.none(),
});

const existingUser = AuthUser.makeUnsafe({
  id: userId,
  email,
  displayName: "OAuth User",
  role: "user",
  primaryProvider: "google",
  createdAt: now,
  updatedAt: now,
});

const existingIdentity = AuthIdentity.makeUnsafe({
  id: identityId,
  userId,
  provider: "google",
  providerId,
  providerData: Option.none(),
  createdAt: now,
});

const authProviderLayer = Layer.succeed(AuthProvider)({
  getAuthorizationUrl: () => "",
  handleCallback: () => Effect.succeed(authResult),
  refreshAccessToken: () => Effect.die("AuthProvider.refreshAccessToken: not used in tests"),
});

const tokenGenLayer = Layer.succeed(GenerateSessionToken)({
  generate: () => Effect.succeed(sessionId),
});

const oauthTokenLayer = Layer.succeed(OAuthTokenRepository)({
  findByIdentityId: () => Effect.die("OAuthTokenRepository.findByIdentityId: not used in tests"),
  upsert: () => Effect.die("OAuthTokenRepository.upsert: not used when tokenData is none"),
});

const sessionRepoLayer = Layer.succeed(SessionRepository)({
  findById: () => Effect.die("SessionRepository.findById: not used in tests"),
  create: (input) =>
    Effect.succeed(
      Session.makeUnsafe({
        id: input.id,
        userId: input.userId,
        provider: input.provider,
        expiresAt: input.expiresAt,
        createdAt: DateTime.fromDateUnsafe(new Date()),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      }),
    ),
  delete: () => Effect.die("SessionRepository.delete: not used in tests"),
});

const callbackInput = {
  code: "auth-code",
  userAgent: Option.none(),
  ipAddress: Option.none(),
} as const;

describe("handleOAuthCallback", () => {
  layer(
    Layer.mergeAll(
      authProviderLayer,
      tokenGenLayer,
      oauthTokenLayer,
      sessionRepoLayer,
      Layer.succeed(IdentityRepository)({
        findByProvider: () => Effect.succeed(Option.some(existingIdentity)),
        findByUserIdAndProvider: () =>
          Effect.die("IdentityRepository.findByUserIdAndProvider: not used"),
        create: () => Effect.die("IdentityRepository.create: not used"),
      }),
      Layer.succeed(UserRepository)({
        findById: () => Effect.succeed(Option.some(existingUser)),
        findByEmail: () => Effect.die("UserRepository.findByEmail: not used"),
        create: () => Effect.die("UserRepository.create: not used"),
      }),
    ),
  )((it) => {
    it.effect("returns existing user when identity is already linked", () =>
      Effect.gen(function* () {
        const out = yield* handleOAuthCallback(callbackInput);
        expect(out.isNewUser).toBe(false);
        expect(out.user.id).toBe(userId);
        expect(out.session.id).toBe(sessionId);
        expect(out.session.userId).toBe(userId);
      }),
    );
  });

  layer(
    Layer.mergeAll(
      authProviderLayer,
      tokenGenLayer,
      oauthTokenLayer,
      sessionRepoLayer,
      Layer.succeed(IdentityRepository)({
        findByProvider: () => Effect.succeed(Option.none()),
        findByUserIdAndProvider: () =>
          Effect.die("IdentityRepository.findByUserIdAndProvider: not used"),
        create: (input) =>
          Effect.succeed(
            AuthIdentity.makeUnsafe({
              id: input.id,
              userId: input.userId,
              provider: input.provider,
              providerId: input.providerId,
              providerData: input.providerData,
              createdAt: now,
            }),
          ),
      }),
      Layer.succeed(UserRepository)({
        findById: () => Effect.die("UserRepository.findById: not used"),
        findByEmail: () => Effect.succeed(Option.some(existingUser)),
        create: () => Effect.die("UserRepository.create: not used"),
      }),
    ),
  )((it) => {
    it.effect("links new identity when email matches existing user", () =>
      Effect.gen(function* () {
        const out = yield* handleOAuthCallback(callbackInput);
        expect(out.isNewUser).toBe(false);
        expect(out.user.id).toBe(userId);
      }),
    );
  });

  layer(
    Layer.mergeAll(
      authProviderLayer,
      tokenGenLayer,
      oauthTokenLayer,
      sessionRepoLayer,
      Layer.succeed(IdentityRepository)({
        findByProvider: () => Effect.succeed(Option.none()),
        findByUserIdAndProvider: () =>
          Effect.die("IdentityRepository.findByUserIdAndProvider: not used"),
        create: (input) =>
          Effect.succeed(
            AuthIdentity.makeUnsafe({
              id: input.id,
              userId: input.userId,
              provider: input.provider,
              providerId: input.providerId,
              providerData: input.providerData,
              createdAt: now,
            }),
          ),
      }),
      Layer.succeed(UserRepository)({
        findById: () => Effect.die("UserRepository.findById: not used"),
        findByEmail: () => Effect.succeed(Option.none()),
        create: (input) =>
          Effect.succeed(
            AuthUser.makeUnsafe({
              id: input.id,
              email: input.email,
              displayName: input.displayName,
              role: input.role,
              primaryProvider: input.primaryProvider,
              createdAt: now,
              updatedAt: now,
            }),
          ),
      }),
    ),
  )((it) => {
    it.effect("creates user and identity when neither identity nor email exists", () =>
      Effect.gen(function* () {
        const out = yield* handleOAuthCallback(callbackInput);
        expect(out.isNewUser).toBe(true);
        expect(out.user.email).toBe(email);
      }),
    );
  });

  layer(
    Layer.mergeAll(
      authProviderLayer,
      tokenGenLayer,
      oauthTokenLayer,
      sessionRepoLayer,
      Layer.succeed(IdentityRepository)({
        findByProvider: () => Effect.succeed(Option.some(existingIdentity)),
        findByUserIdAndProvider: () =>
          Effect.die("IdentityRepository.findByUserIdAndProvider: not used"),
        create: () => Effect.die("IdentityRepository.create: not used"),
      }),
      Layer.succeed(UserRepository)({
        findById: () => Effect.succeed(Option.none()),
        findByEmail: () => Effect.die("UserRepository.findByEmail: not used"),
        create: () => Effect.die("UserRepository.create: not used"),
      }),
    ),
  )((it) => {
    it.effect("fails when identity exists but user row is missing", () =>
      Effect.gen(function* () {
        const exit = yield* Effect.exit(handleOAuthCallback(callbackInput));
        expect(Exit.isFailure(exit)).toBe(true);
        if (Exit.isFailure(exit)) {
          const err = Cause.squash(exit.cause);
          expect(isProviderAuthFailedError(err)).toBe(true);
          if (isProviderAuthFailedError(err)) {
            expect(err.reason).toBe("User not found for existing identity");
          }
        }
      }),
    );
  });
});
