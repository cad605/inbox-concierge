import { getRouteApi } from "@tanstack/react-router";

import { useInbox } from "#features/inbox/context.tsx";
import type { InboxThreadTableRow } from "#features/inbox/domain/types.ts";

const inboxRouteApi = getRouteApi("/_authenticated/");

const defaultPageSize = 25;

export function useInboxThreadListState() {
  const { useInboxThreadsInfiniteQuery, useInboxThreadsErrorRetry } = useInbox();
  const search = inboxRouteApi.useSearch();
  const pageSize = search.pageSize ?? defaultPageSize;

  const {
    data: threads,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isReady,
  } = useInboxThreadsInfiniteQuery({ pageSize }, [pageSize]);

  const onRetryThreads = useInboxThreadsErrorRetry();
  const listReady = isReady && !isError;
  const threadList = (threads ?? []) as ReadonlyArray<InboxThreadTableRow>;

  return {
    pageSize,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    isReady,
    listReady,
    threadList,
    onRetryThreads,
  };
}
