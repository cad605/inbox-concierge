import { Box, Stack } from "@chakra-ui/react";
import { Suspense } from "react";

import type { ShellUser } from "#features/shell/domain/types.ts";
import {
  SidebarPendingJobsErrorFallback,
  SidebarPendingSync,
  SidebarPendingSyncFallback,
} from "#features/shell/sidebar-pending-sync.tsx";
import { ErrorBoundary } from "#ui/error-boundary.tsx";

type AppSidebarProps = {
  user: ShellUser;
};

export function AppSidebar({ user }: AppSidebarProps) {
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
        <ErrorBoundary
          fallbackRender={({ reset }) => <SidebarPendingJobsErrorFallback reset={reset} />}
        >
          <Suspense fallback={<SidebarPendingSyncFallback />}>
            <SidebarPendingSync user={user} />
          </Suspense>
        </ErrorBoundary>
      </Stack>
    </Box>
  );
}
