import { ServiceMap } from "effect";
import type { PersistedQueue } from "effect/unstable/persistence";

import type { InboxSyncJobPayload } from "#domain/dtos/inbox-sync-job-payload.ts";

export class InboxSyncQueue extends ServiceMap.Service<
  InboxSyncQueue,
  PersistedQueue.PersistedQueue<typeof InboxSyncJobPayload.Type>
>()("app/ports/InboxSyncQueue") {}
