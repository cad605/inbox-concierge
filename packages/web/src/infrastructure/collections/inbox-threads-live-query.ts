import type { InitialQueryBuilder } from "@tanstack/react-db";

import { threadCollection } from "#infrastructure/collections/threads.ts";

/**
 * Live query for inbox threads (newest first). Used with `useLiveInfiniteQuery`;
 * `orderBy` is required so the live query collection can apply `setWindow` for pagination.
 */
export function inboxThreadsLiveQuery(q: InitialQueryBuilder) {
  return q.from({ thread: threadCollection }).orderBy(({ thread }) => thread.lastMessageAt, "desc");
}
