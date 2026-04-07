import { Layer } from "effect";

import { AuthProviderGoogleLive } from "#adapters/auth-provider-google.adapter.ts";
import { CheckPermissionLive } from "#adapters/check-permission.adapter.ts";
import { IdentityRepositoryLive } from "#adapters/identity-repository.adapter.ts";
import { InboxProviderGoogleLive } from "#adapters/inbox-provider-google.adapter.ts";
import { LabelRepositoryLive } from "#adapters/label-repository.adapter.ts";
import { MessageAutoLabelerLive } from "#adapters/message-auto-labeler.adapter.ts";
import { MessageLabelExampleRepositoryLive } from "#adapters/message-label-example-repository.adapter.ts";
import { MessageLabelRepositoryLive } from "#adapters/message-label-repository.adapter.ts";
import { OAuthTokenRepositoryLive } from "#adapters/oauth-token-repository.adapter.ts";
import { PendingPersistedJobsRepositoryLive } from "#adapters/pending-persisted-jobs-repository.adapter.ts";
import { SessionRepositoryLive } from "#adapters/session-repository.adapter.ts";
import { SessionTokenGeneratorLive } from "#adapters/session-token-generator.adapter.ts";
import { ThreadRepositoryLive } from "#adapters/thread-repository.adapter.ts";
import { UserRepositoryLive } from "#adapters/user-repository.adapter.ts";

export const AdaptersLive = Layer.mergeAll(
  CheckPermissionLive,
  InboxProviderGoogleLive,
  ThreadRepositoryLive,
  UserRepositoryLive,
  IdentityRepositoryLive,
  SessionRepositoryLive,
  AuthProviderGoogleLive,
  SessionTokenGeneratorLive,
  LabelRepositoryLive,
  MessageAutoLabelerLive,
  MessageLabelExampleRepositoryLive,
  OAuthTokenRepositoryLive,
  MessageLabelRepositoryLive,
  PendingPersistedJobsRepositoryLive,
);
