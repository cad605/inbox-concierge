import { m } from "$paraglide/messages.js";
import { Alert, Button, Skeleton, Stack } from "@chakra-ui/react";
import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { useCallback, useEffect, type ReactNode } from "react";

import { useShell } from "#features/shell/context.tsx";
import type { ShellUser } from "#features/shell/domain/types.ts";
import { SidebarNav } from "#features/shell/ui/sidebar-nav.tsx";
import { SidebarUser } from "#features/shell/ui/sidebar-user.tsx";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { pendingJobsCollection } from "#infrastructure/collections/pending-jobs.ts";
import { useInvalidateThreadsWhenPendingJobsCountsChange } from "#infrastructure/hooks/use-invalidate-threads-when-pending-jobs-change.ts";
import { toaster } from "#ui/toaster.tsx";

function useSidebarPendingSyncModel() {
  const { useSyncInbox } = useShell();
  const { mutate: syncInbox, isPending: isSyncing, isError, error, reset } = useSyncInbox();

  useEffect(() => {
    if (!isError) {
      return;
    }
    toaster.create({
      title: error != null ? getErrorMessage(error) : "Sync failed",
      type: "error",
    });
    reset();
  }, [isError, error, reset]);
  const { data: pendingRows } = useLiveSuspenseQuery(
    (q) => q.from({ pending: pendingJobsCollection }),
    [],
  );
  const pending = pendingRows[0];
  useInvalidateThreadsWhenPendingJobsCountsChange(
    pending?.userInboxSyncCount,
    pending?.messageAutoLabelCount,
  );
  const hasPendingBackgroundJobs =
    pending !== undefined && (pending.userInboxSyncCount > 0 || pending.messageAutoLabelCount > 0);

  return {
    syncInbox: () => {
      syncInbox();
    },
    isSyncing,
    hasPendingBackgroundJobs,
  };
}

function useRefetchPendingJobsForShell(): () => void {
  return useCallback(() => {
    void pendingJobsCollection.utils.refetch();
  }, []);
}

export type SidebarPendingSyncProps = {
  readonly user: ShellUser;
};

export function SidebarPendingSync({ user }: SidebarPendingSyncProps) {
  const { syncInbox, isSyncing, hasPendingBackgroundJobs } = useSidebarPendingSyncModel();

  return (
    <>
      <SidebarUser displayName={user.displayName} email={user.email} />
      <SidebarNav
        hasPendingBackgroundJobs={hasPendingBackgroundJobs}
        isSyncing={isSyncing}
        onSyncInbox={() => syncInbox()}
      />
    </>
  );
}

export function SidebarPendingSyncFallback() {
  return (
    <Stack gap={4}>
      <Stack gap={2}>
        <Skeleton height="10" rounded="md" />
        <Skeleton height="4" maxW="48" />
      </Stack>
      <Skeleton height="8" maxW="full" rounded="md" />
    </Stack>
  );
}

export function SidebarPendingJobsErrorFallback(props: { readonly reset: () => void }): ReactNode {
  const { reset } = props;
  const refetchPendingJobs = useRefetchPendingJobsForShell();
  return (
    <Stack gap={2}>
      <Alert.Root size="sm" status="error">
        <Alert.Description>{m.pending_jobs_error()}</Alert.Description>
      </Alert.Root>
      <Button
        size="xs"
        variant="outline"
        onClick={() => {
          refetchPendingJobs();
          reset();
        }}
      >
        {m.home_threads_retry()}
      </Button>
    </Stack>
  );
}
