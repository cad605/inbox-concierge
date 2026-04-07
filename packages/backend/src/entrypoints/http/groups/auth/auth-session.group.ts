import { HttpApiBuilder } from "effect/unstable/httpapi";

import { AppApi } from "#entrypoints/http/api.ts";
import { logoutHandler } from "#entrypoints/http/groups/auth/handlers/logout.handler.ts";
import { meHandler } from "#entrypoints/http/groups/auth/handlers/me.handler.ts";
import { pendingJobsHandler } from "#entrypoints/http/groups/auth/handlers/pending-jobs.handler.ts";
import { refreshHandler } from "#entrypoints/http/groups/auth/handlers/refresh.handler.ts";

export const AuthSessionHandlers = HttpApiBuilder.group(AppApi, "authSession", (handlers) =>
  handlers
    .handle("me", meHandler)
    .handle("logout", logoutHandler)
    .handle("refresh", refreshHandler)
    .handle("pendingJobs", pendingJobsHandler),
);
