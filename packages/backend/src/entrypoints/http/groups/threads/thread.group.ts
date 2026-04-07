import { HttpApiBuilder } from "effect/unstable/httpapi";

import { AppApi } from "#entrypoints/http/api.ts";
import { listThreadsHandler } from "#entrypoints/http/groups/threads/handlers/list-threads.handler.ts";
import { syncThreadsHandler } from "#entrypoints/http/groups/threads/handlers/sync-threads.handler.ts";

export const ThreadHandlers = HttpApiBuilder.group(AppApi, "threads", (handlers) =>
  handlers.handle("listThreads", listThreadsHandler).handle("syncThreads", syncThreadsHandler),
);
