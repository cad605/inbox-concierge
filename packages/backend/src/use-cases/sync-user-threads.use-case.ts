import { DateTime, Effect, Option, Redacted } from "effect";

import { AutoLabelJobPayload } from "#domain/dtos/auto-label-job-payload.ts";
import { InboxNotConnectedError } from "#domain/errors/inbox-not-connected-error.ts";
import { InboxReauthorizationRequiredError } from "#domain/errors/inbox-reauthorization-required-error.ts";
import { InboxSyncError } from "#domain/errors/inbox-sync-error.ts";
import { logAndFailWith } from "#domain/errors/tap-log-and-map-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";
import type { OAuthToken } from "#domain/models/oauth-token.ts";
import { ThreadId } from "#domain/models/thread.ts";
import { generateId } from "#lib/uuid.ts";
import { AuthProvider } from "#ports/auth-provider.port.ts";
import { AutoLabelQueue } from "#ports/auto-label-queue.port.ts";
import { IdentityRepository } from "#ports/identity-repository.port.ts";
import { InboxProvider } from "#ports/inbox-provider.port.ts";
import { OAuthTokenRepository } from "#ports/oauth-token-repository.port.ts";
import { ThreadRepository } from "#ports/thread-repository.port.ts";

export const syncUserThreads = Effect.fn("syncUserThreads")(
  function* (userId: AuthUserId) {
    const identityRepo = yield* IdentityRepository;
    const oauthTokenRepo = yield* OAuthTokenRepository;
    const inboxProvider = yield* InboxProvider;
    const threadRepo = yield* ThreadRepository;
    const queue = yield* AutoLabelQueue;

    const identity = yield* identityRepo.findByUserIdAndProvider(userId, "google");
    if (Option.isNone(identity)) {
      return yield* new InboxNotConnectedError();
    }

    const token = yield* oauthTokenRepo.findByIdentityId(identity.value.id);
    if (Option.isNone(token)) {
      return yield* new InboxNotConnectedError();
    }

    const authProvider = yield* AuthProvider;
    let oauthToken: OAuthToken = token.value;

    const now = DateTime.nowUnsafe();
    const refreshIfExpiresBefore = DateTime.add(now, { seconds: 60 });
    if (oauthToken.isExpired(refreshIfExpiresBefore)) {
      if (Option.isNone(oauthToken.refreshToken)) {
        return yield* new InboxReauthorizationRequiredError();
      }
      const refreshed = yield* authProvider
        .refreshAccessToken(oauthToken.refreshToken.value)
        .pipe(
          Effect.catchTag("ProviderAuthFailedError", () =>
            Effect.fail(new InboxReauthorizationRequiredError()),
          ),
        );
      const expiresAt = new Date(Date.now() + refreshed.expiresIn * 1000);
      oauthToken = yield* oauthTokenRepo.upsert({
        id: oauthToken.id,
        identityId: oauthToken.identityId,
        accessToken: refreshed.accessToken,
        refreshToken: Option.getOrUndefined(refreshed.refreshToken),
        tokenType: refreshed.tokenType,
        scopes: refreshed.scopes,
        expiresAt,
      });
    }

    const accessToken = Redacted.value(oauthToken.accessToken);

    const threadList = yield* inboxProvider.listThreads({
      accessToken,
      maxResults: 200,
    });

    yield* Effect.forEach(
      threadList,
      (item) =>
        Effect.gen(function* () {
          const { threadId, messages } = yield* inboxProvider.getThread({
            accessToken,
            threadId: item.threadId,
          });

          if (messages.length === 0) return;

          const firstMessage = messages[0]!;
          const lastMessage = messages[messages.length - 1]!;

          const thread = yield* threadRepo.upsertThread({
            id: ThreadId.makeUnsafe(generateId()),
            userId,
            externalId: threadId,
            subject: firstMessage.subject,
            snippet: item.snippet,
            lastMessageAt: lastMessage.receivedAt,
            messageCount: messages.length,
            historyId: item.historyId,
          });

          const messageIds = yield* threadRepo.upsertMessages(
            userId,
            thread.id,
            messages.map((msg) => ({
              externalId: msg.messageId,
              subject: msg.subject,
              snippet: msg.snippet,
              bodyText: msg.bodyText,
              fromName: msg.fromName,
              fromEmail: msg.fromEmail,
              toHeader: msg.toHeader,
              ccHeader: msg.ccHeader,
              bccHeader: msg.bccHeader,
              receivedAt: msg.receivedAt,
              externalLabels: msg.labelIds,
            })),
          );

          yield* Effect.forEach(
            messageIds,
            (messageId) => queue.offer(AutoLabelJobPayload.makeUnsafe({ userId, messageId })),
            { concurrency: 24 },
          );
        }),
      { concurrency: 5 },
    );
  },
  Effect.tapError((error) => Effect.logError(error.message)),
  Effect.catchTags({
    SchemaError: logAndFailWith("syncUserThreads: SchemaError", InboxSyncError.fromError),
    PersistedQueueError: logAndFailWith(
      "syncUserThreads: PersistedQueueError",
      InboxSyncError.fromError,
    ),
  }),
);
