import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { useCallback } from "react";

import { pendingJobsCollection } from "#infrastructure/collections/pending-jobs.ts";

/** Subscribe to pending-jobs so first-load errors surface to an ErrorBoundary. */
export function useInboxPendingJobsErrorSinkSubscription(): void {
  useLiveSuspenseQuery((q) => q.from({ pending: pendingJobsCollection }), []);
}

export function useRefetchPendingJobs(): () => void {
  return useCallback(() => {
    void pendingJobsCollection.utils.refetch();
  }, []);
}

export function useInboxPendingJobsRowForEmptyState(): {
  readonly showInboxSetupEmpty: boolean;
} {
  const { data: pendingRows } = useLiveSuspenseQuery(
    (q) => q.from({ pending: pendingJobsCollection }),
    [],
  );
  const pending = pendingRows[0];
  const showInboxSetupEmpty = pending !== undefined && pending.userInboxSyncCount > 0;
  return { showInboxSetupEmpty };
}
