import { createContext, type ReactNode, use } from "react";

import {
  useInboxPendingJobsErrorSinkSubscription as useInboxPendingJobsErrorSinkSubscriptionApi,
  useInboxPendingJobsRowForEmptyState as useInboxPendingJobsRowForEmptyStateApi,
  useRefetchPendingJobs as useRefetchPendingJobsApi,
} from "#features/inbox/adapters/use-inbox-pending-jobs.adapter.ts";
import { useInboxThreadsInfiniteQuery as useInboxThreadsInfiniteQueryApi } from "#features/inbox/adapters/use-inbox-threads-infinite-query.adapter.ts";
import { useInboxThreadsErrorRetry as useInboxThreadsErrorRetryApi } from "#features/inbox/adapters/use-inbox-threads-retry.adapter.ts";
import { useSyncInbox as useSyncInboxApi } from "#features/inbox/adapters/use-sync-inbox.adapter.ts";
import type { InboxPorts } from "#features/inbox/ports/inbox.port.ts";

const InboxContext = createContext<InboxPorts | null>(null);

export const useInbox = (): InboxPorts => {
  const context = use(InboxContext);
  if (!context) {
    throw new Error("useInbox must be used within InboxProvider");
  }
  return context;
};

type InboxProviderProps = {
  readonly children: ReactNode;
  readonly adapters?: Partial<InboxPorts>;
};

export const InboxProvider = ({ children, adapters }: InboxProviderProps) => {
  const value: InboxPorts = {
    useInboxThreadsInfiniteQuery:
      adapters?.useInboxThreadsInfiniteQuery ?? useInboxThreadsInfiniteQueryApi,
    useInboxThreadsErrorRetry: adapters?.useInboxThreadsErrorRetry ?? useInboxThreadsErrorRetryApi,
    useInboxPendingJobsErrorSinkSubscription:
      adapters?.useInboxPendingJobsErrorSinkSubscription ??
      useInboxPendingJobsErrorSinkSubscriptionApi,
    useInboxPendingJobsRowForEmptyState:
      adapters?.useInboxPendingJobsRowForEmptyState ?? useInboxPendingJobsRowForEmptyStateApi,
    useRefetchPendingJobs: adapters?.useRefetchPendingJobs ?? useRefetchPendingJobsApi,
    useSyncInbox: adapters?.useSyncInbox ?? useSyncInboxApi,
  };

  return <InboxContext value={value}>{children}</InboxContext>;
};
