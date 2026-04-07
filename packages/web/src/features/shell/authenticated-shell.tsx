import { Box, Flex } from "@chakra-ui/react";
import { Outlet } from "@tanstack/react-router";

import { AppSidebar } from "#features/shell/app-sidebar.tsx";
import { useAuthUser } from "#infrastructure/hooks/use-auth.ts";

export function AuthenticatedShell() {
  const user = useAuthUser();

  if (!user) {
    return null;
  }

  return (
    <Flex
      flex={1}
      flexDirection={{ base: "column", md: "row" }}
      gap={{ base: 3, md: 0 }}
      minH={0}
      width="full"
    >
      <AppSidebar user={user} />

      <Box
        display="flex"
        flex={1}
        flexDirection="column"
        minH={0}
        overflow="hidden"
        paddingBottom={{ base: 0, md: 4 }}
        paddingInline={{ base: 0, md: 4 }}
        paddingTop={{ base: 2, md: 4 }}
      >
        <Outlet />
      </Box>
    </Flex>
  );
}
