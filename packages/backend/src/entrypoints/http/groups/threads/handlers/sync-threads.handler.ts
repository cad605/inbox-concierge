import { Effect } from "effect";

import { CurrentUser } from "#entrypoints/http/middleware/auth.middleware.ts";
import { syncUserThreads } from "#use-cases/sync-user-threads.use-case.ts";

export const syncThreadsHandler = () =>
  Effect.gen(function* () {
    const user = yield* CurrentUser;
    yield* syncUserThreads(user.id);
  });
