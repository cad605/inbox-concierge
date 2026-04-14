/**
 * Port contracts for inbox feature IO (implemented in `adapters/` only).
 */

import type { InboxThreadTableRow } from "#features/inbox/domain/types.ts";

/** Result shape for triggering a full inbox sync (e.g. from shell nav). */
export type UseSyncInboxResult = {
  readonly mutate: () => void;
  readonly isPending: boolean;
  readonly isError: boolean;
  readonly error: Error | null;
  readonly reset: () => void;
};

export type UseSyncInbox = () => UseSyncInboxResult;

export type InboxThreadsInfiniteConfig = {
  readonly pageSize?: number;
  readonly initialPageParam?: number;
};

export type InboxThreadsInfiniteQueryResult = {
  readonly data: ReadonlyArray<InboxThreadTableRow> | undefined;
  readonly fetchNextPage: () => void;
  readonly hasNextPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isError: boolean;
  readonly isReady: boolean;
};

export type UseInboxThreadsInfiniteQuery = (
  config: InboxThreadsInfiniteConfig,
  deps: Array<unknown>,
) => InboxThreadsInfiniteQueryResult;

export type UseInboxThreadsErrorRetry = () => () => void;

export type UseInboxPendingJobsErrorSinkSubscription = () => void;

export type UseInboxPendingJobsRowForEmptyState = () => {
  readonly showInboxSetupEmpty: boolean;
};

export type UseRefetchPendingJobs = () => () => void;

export type InboxPorts = {
  readonly useInboxThreadsInfiniteQuery: UseInboxThreadsInfiniteQuery;
  readonly useInboxThreadsErrorRetry: UseInboxThreadsErrorRetry;
  readonly useInboxPendingJobsErrorSinkSubscription: UseInboxPendingJobsErrorSinkSubscription;
  readonly useInboxPendingJobsRowForEmptyState: UseInboxPendingJobsRowForEmptyState;
  readonly useRefetchPendingJobs: UseRefetchPendingJobs;
  readonly useSyncInbox: UseSyncInbox;
};
