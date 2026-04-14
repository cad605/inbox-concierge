import { useLiveInfiniteQuery } from "@tanstack/react-db";

import type {
  InboxThreadsInfiniteConfig,
  InboxThreadsInfiniteQueryResult,
} from "#features/inbox/ports/inbox.port.ts";
import { inboxThreadsLiveQuery } from "#infrastructure/collections/inbox-threads-live-query.ts";

/**
 * Inbox thread list: `useLiveInfiniteQuery` on {@link inboxThreadsLiveQuery}.
 */
export function useInboxThreadsInfiniteQuery(
  config: InboxThreadsInfiniteConfig,
  deps: Array<unknown>,
): InboxThreadsInfiniteQueryResult {
  const pageSize = config.pageSize ?? 25;
  const initialPageParam = config.initialPageParam ?? 0;

  return useLiveInfiniteQuery(
    (q) => inboxThreadsLiveQuery(q),
    {
      initialPageParam,
      pageSize,
      getNextPageParam: (lastPage, allPages) =>
        lastPage.length === pageSize ? allPages.length : undefined,
    },
    deps,
  ) as InboxThreadsInfiniteQueryResult;
}
