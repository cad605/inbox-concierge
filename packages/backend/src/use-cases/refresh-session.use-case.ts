import { DateTime, Effect, type Option } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { AuthSessionId } from "#domain/models/session.ts";
import type { AuthProviderType } from "#domain/shared/auth-provider-type.ts";
import type { UserAgent } from "#domain/shared/user-agent.ts";
import { GenerateSessionToken } from "#ports/generate-session-token.port.ts";
import { SessionRepository } from "#ports/session-repository.port.ts";

const SESSION_DURATION_HOURS = 24;

export const refreshSession = Effect.fn("refreshSession")(function* (input: {
  readonly currentSessionId: AuthSessionId;
  readonly userId: AuthUserId;
  readonly provider: AuthProviderType;
  readonly userAgent: Option.Option<UserAgent>;
  readonly ipAddress: Option.Option<string>;
}) {
  const sessionRepo = yield* SessionRepository;
  const tokenGen = yield* GenerateSessionToken;

  yield* sessionRepo.delete(input.currentSessionId);

  const newTokenId = yield* tokenGen.generate();
  const now = DateTime.nowUnsafe();
  const expiresAt = DateTime.add(now, { hours: SESSION_DURATION_HOURS });

  return yield* sessionRepo.create({
    id: newTokenId,
    userId: input.userId,
    provider: input.provider,
    expiresAt,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  });
});
