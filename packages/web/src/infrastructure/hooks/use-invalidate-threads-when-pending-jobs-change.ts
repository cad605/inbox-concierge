import { useEffect, useRef } from "react";

import { queryClient } from "#infrastructure/query-client.ts";
import { threadKeys } from "#infrastructure/query-keys.ts";

/**
 * When pending-jobs counts change, invalidate thread list queries so the inbox refetches.
 * Call from a component that already reads `pendingJobsCollection` (e.g. sidebar).
 */
export function useInvalidateThreadsWhenPendingJobsCountsChange(
  userInboxSyncCount: number | undefined,
  messageAutoLabelCount: number | undefined,
): void {
  const prevRef = useRef<{ userInboxSyncCount: number; messageAutoLabelCount: number } | null>(
    null,
  );

  useEffect(() => {
    if (userInboxSyncCount === undefined || messageAutoLabelCount === undefined) {
      return;
    }

    const snapshot = { userInboxSyncCount, messageAutoLabelCount };
    const prev = prevRef.current;
    prevRef.current = snapshot;

    if (prev === null) {
      return;
    }

    if (
      prev.userInboxSyncCount === snapshot.userInboxSyncCount &&
      prev.messageAutoLabelCount === snapshot.messageAutoLabelCount
    ) {
      return;
    }

    queryClient.invalidateQueries({ queryKey: threadKeys.all });
  }, [userInboxSyncCount, messageAutoLabelCount]);
}
