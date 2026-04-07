import { Box, Stack } from "@chakra-ui/react";
import { useLiveQuery } from "@tanstack/react-db";

import { useSyncInbox } from "#features/inbox/use-sync-inbox.ts";
import { SidebarNav } from "#features/shell/sidebar-nav.tsx";
import { SidebarUser } from "#features/shell/sidebar-user.tsx";
import { pendingJobsCollection } from "#infrastructure/collections/pending-jobs.ts";
import type { AuthUser } from "#infrastructure/hooks/use-auth.ts";
import { useInvalidateThreadsWhenPendingJobsCountsChange } from "#infrastructure/hooks/use-invalidate-threads-when-pending-jobs-change.ts";

type AppSidebarProps = {
  user: AuthUser;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const { mutate: syncInbox, isPending: isSyncing } = useSyncInbox();
  const { data: pendingRows } = useLiveQuery((q) => q.from({ pending: pendingJobsCollection }));
  const pending = pendingRows?.[0];
  useInvalidateThreadsWhenPendingJobsCountsChange(
    pending?.userInboxSyncCount,
    pending?.messageAutoLabelCount,
  );
  const hasPendingBackgroundJobs =
    pending !== undefined && (pending.userInboxSyncCount > 0 || pending.messageAutoLabelCount > 0);

  return (
    <Box
      as="aside"
      flexShrink={0}
      paddingBottom={{ base: 0, md: 4 }}
      paddingInline={{ base: 0, md: 4 }}
      paddingTop={{ base: 2, md: 4 }}
      width={{ base: "full", md: "260px" }}
    >
      <Stack gap={6}>
        <SidebarUser displayName={user.displayName} email={user.email} />
        <SidebarNav
          hasPendingBackgroundJobs={hasPendingBackgroundJobs}
          isSyncing={isSyncing}
          onSyncInbox={() => syncInbox()}
        />
      </Stack>
    </Box>
  );
}
