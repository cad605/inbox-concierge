import { m } from "$paraglide/messages.js";
import { Box, Button, HStack, Separator, Stack, Status, Text } from "@chakra-ui/react";
import { LuInbox, LuLogOut, LuRefreshCw, LuSettings } from "react-icons/lu";

import { Link } from "#ui/link.tsx";
import { Tooltip } from "#ui/tooltip.tsx";

type SidebarNavProps = {
  hasPendingBackgroundJobs?: boolean;
  isSyncing: boolean;
  onSyncInbox: () => void;
};

export function SidebarNav({
  hasPendingBackgroundJobs = false,
  isSyncing,
  onSyncInbox,
}: SidebarNavProps) {
  const syncAriaLabel = isSyncing
    ? m.home_threads_sync_aria_busy()
    : hasPendingBackgroundJobs
      ? m.home_threads_sync_disabled_aria()
      : m.home_threads_sync();

  return (
    <Stack gap={1}>
      <Link
        activeOptions={{ exact: true }}
        activeProps={{
          bg: "bg.muted",
          rounded: "l2",
        }}
        alignItems="center"
        color="fg"
        display="flex"
        gap={3}
        paddingX={3}
        paddingY={2}
        to="/"
        width="full"
      >
        <LuInbox aria-hidden size={18} />
        <Text fontSize="sm">{m.nav_inbox()}</Text>
      </Link>

      <Link
        activeProps={{
          bg: "bg.muted",
          rounded: "l2",
        }}
        alignItems="center"
        color="fg"
        display="flex"
        gap={3}
        paddingX={3}
        paddingY={2}
        to="/settings"
        width="full"
      >
        <LuSettings aria-hidden size={18} />
        <Text fontSize="sm">{m.nav_settings()}</Text>
      </Link>

      <Separator marginY={1} />

      <HStack align="center" gap={2} width="full">
        <Button
          aria-busy={isSyncing}
          aria-label={syncAriaLabel}
          disabled={isSyncing || hasPendingBackgroundJobs}
          flex={1}
          minW={0}
          onClick={() => onSyncInbox()}
          size="sm"
          variant="ghost"
          fontWeight="normal"
        >
          <LuRefreshCw aria-hidden size={18} />
          <Box as="span" flex={1} minW={0} textAlign="start">
            {m.home_threads_sync()}
          </Box>
        </Button>

        {isSyncing || hasPendingBackgroundJobs ? (
          <Tooltip content={m.nav_pending_jobs_indicator()} showArrow>
            <Box
              alignItems="center"
              display="flex"
              flexShrink={0}
              height="1lh"
              justifyContent="center"
              width="12px"
            >
              <Status.Root colorPalette="orange" size="sm">
                <Status.Indicator />
              </Status.Root>
            </Box>
          </Tooltip>
        ) : null}
      </HStack>

      <Link
        alignItems="center"
        color="fg"
        display="flex"
        gap={3}
        paddingX={3}
        paddingY={2}
        to="/sign-out"
        width="full"
      >
        <LuLogOut aria-hidden size={18} />
        <Text fontSize="sm">{m.nav_sign_out()}</Text>
      </Link>
    </Stack>
  );
}
