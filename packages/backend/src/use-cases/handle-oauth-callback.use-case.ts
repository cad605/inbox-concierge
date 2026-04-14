import { DateTime, Effect, Option } from "effect";

import type { AuthResult } from "#domain/dtos/auth-result.ts";
import { ProviderAuthFailedError } from "#domain/errors/provider-auth-failed-error.ts";
import { AuthIdentityId } from "#domain/models/auth-identity.ts";
import { AuthUserId } from "#domain/models/auth-user.ts";
import { OAuthTokenId } from "#domain/models/oauth-token.ts";
import type { UserAgent } from "#domain/shared/user-agent.ts";
import { generateId } from "#lib/uuid.ts";
import { AuthProvider } from "#ports/auth-provider.port.ts";
import { GenerateSessionToken } from "#ports/generate-session-token.port.ts";
import { IdentityRepository } from "#ports/identity-repository.port.ts";
import { OAuthTokenRepository } from "#ports/oauth-token-repository.port.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";
import { UserRepository } from "#ports/user-repository.port.ts";

const SESSION_DURATION_HOURS = 24;

const findOrCreateUser = Effect.fn("findOrCreateUser")(function* (authResult: AuthResult) {
  const identityRepo = yield* IdentityRepository;
  const userRepo = yield* UserRepository;

  const existingIdentity = yield* identityRepo.findByProvider("google", authResult.providerId);

  if (Option.isSome(existingIdentity)) {
    const maybeUser = yield* userRepo.findById(existingIdentity.value.userId);
    if (Option.isNone(maybeUser)) {
      return yield* new ProviderAuthFailedError({
        reason: "User not found for existing identity",
      });
    }
    return { user: maybeUser.value, identityId: existingIdentity.value.id, isNewUser: false };
  }

  const maybeUserByEmail = yield* userRepo.findByEmail(authResult.email);

  if (Option.isSome(maybeUserByEmail)) {
    const identityId = AuthIdentityId.makeUnsafe(generateId());
    yield* identityRepo.create({
      id: identityId,
      userId: maybeUserByEmail.value.id,
      provider: "google",
      providerId: authResult.providerId,
      providerData: authResult.providerData,
    });
    return { user: maybeUserByEmail.value, identityId, isNewUser: false };
  }

  const userId = AuthUserId.makeUnsafe(generateId());
  const user = yield* userRepo.create({
    id: userId,
    email: authResult.email,
    displayName: authResult.displayName,
    role: "user",
    primaryProvider: "google",
  });
  const identityId = AuthIdentityId.makeUnsafe(generateId());
  yield* identityRepo.create({
    id: identityId,
    userId: user.id,
    provider: "google",
    providerId: authResult.providerId,
    providerData: authResult.providerData,
  });
  return { user, identityId, isNewUser: true };
});

export const handleOAuthCallback = Effect.fn("handleOAuthCallback")(function* (input: {
  readonly code: string;
  readonly codeVerifier: string;
  readonly userAgent: Option.Option<UserAgent>;
  readonly ipAddress: Option.Option<string>;
}) {
  const authProvider = yield* AuthProvider;
  const tokenGen = yield* GenerateSessionToken;
  const sessionRepo = yield* SessionRepository;
  const oauthTokenRepo = yield* OAuthTokenRepository;

  const authResult = yield* authProvider.handleCallback(input.code, input.codeVerifier);
  const { user, identityId, isNewUser } = yield* findOrCreateUser(authResult);

  if (Option.isSome(authResult.tokenData)) {
    const tokenData = authResult.tokenData.value;
    const expiresAt = new Date(Date.now() + tokenData.expiresIn * 1000);
    yield* oauthTokenRepo.upsert({
      id: OAuthTokenId.makeUnsafe(generateId()),
      identityId,
      accessToken: tokenData.accessToken,
      refreshToken: Option.getOrUndefined(tokenData.refreshToken),
      tokenType: tokenData.tokenType,
      scopes: tokenData.scopes,
      expiresAt,
    });
  }

  const sessionId = yield* tokenGen.generate();
  const now = DateTime.nowUnsafe();
  const expiresAt = DateTime.add(now, { hours: SESSION_DURATION_HOURS });

  const session = yield* sessionRepo.create({
    id: sessionId,
    userId: user.id,
    provider: "google",
    expiresAt,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });

  return { user, session, isNewUser };
});
