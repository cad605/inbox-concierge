import { Effect } from "effect";

import type { AuthUserId } from "#domain/models/auth-user.ts";
import { CheckPermission } from "#ports/check-permission.port.ts";
import { PendingPersistedJobsRepository } from "#ports/pending-persisted-jobs-repository.port.ts";

export const getPendingPersistedJobsForUser = Effect.fn("getPendingPersistedJobsForUser")(
  function* (userId: AuthUserId) {
    const checkPermission = yield* CheckPermission;
    yield* checkPermission({
      actorId: userId,
      action: "read",
      resource: "pendingJobs",
      resourceId: userId,
    });
    const repo = yield* PendingPersistedJobsRepository;
    return yield* repo.countsForUser(userId);
  },
);
