import { type Effect, ServiceMap } from "effect";

import type { PendingPersistedJobCounts } from "#domain/dtos/pending-persisted-job-counts.ts";
import type { DatabaseUnavailableError } from "#domain/errors/database-unavailable-error.ts";
import type { AuthUserId } from "#domain/models/auth-user.ts";

export class PendingPersistedJobsRepository extends ServiceMap.Service<
  PendingPersistedJobsRepository,
  {
    readonly countsForUser: (
      userId: AuthUserId,
    ) => Effect.Effect<PendingPersistedJobCounts, DatabaseUnavailableError>;
  }
>()("app/ports/PendingPersistedJobsRepository") {}
