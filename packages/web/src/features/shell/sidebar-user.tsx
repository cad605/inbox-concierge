import { AvatarFallback, AvatarRoot, Box, Flex, Text } from "@chakra-ui/react";

type SidebarUserProps = {
  displayName: string;
  email: string;
};

export function SidebarUser({ displayName, email }: SidebarUserProps) {
  return (
    <Flex align="flex-start" gap={3} paddingX={{ base: 0, md: 1 }}>
      <AvatarRoot flexShrink={0} rounded="sm" size="sm">
        <AvatarFallback name={displayName} />
      </AvatarRoot>
      <Box flex={1} lineHeight="short" minW={0}>
        <Text fontWeight="semibold" title={displayName || undefined} truncate>
          {displayName}
        </Text>
        <Text color="fg.muted" fontSize="sm" title={email || undefined} truncate>
          {email}
        </Text>
      </Box>
    </Flex>
  );
}
