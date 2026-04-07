import { Effect } from "effect";

import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { getPendingPersistedJobsForUser } from "#use-cases/get-pending-persisted-jobs-for-user.use-case.ts";

export const pendingJobsHandler = () =>
  Effect.gen(function* () {
    const user = yield* CurrentUser;
    return yield* getPendingPersistedJobsForUser(user.id);
  });
