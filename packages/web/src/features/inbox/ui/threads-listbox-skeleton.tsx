import { m } from "$paraglide/messages.js";
import { Box, Flex, HStack, Skeleton, Stack, VStack } from "@chakra-ui/react";

export type ThreadsListboxSkeletonProps = {
  readonly rowCount: number;
};

export function ThreadsListboxSkeleton({ rowCount }: ThreadsListboxSkeletonProps) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <Box
      aria-busy
      aria-label={m.home_threads_loading()}
      borderWidth="1px"
      flex={1}
      height="100%"
      minH={0}
      overflowY="auto"
      rounded="md"
    >
      <Stack gap={0}>
        {rows.map((key) => (
          <Box
            borderBottomWidth="1px"
            borderColor="border.muted"
            key={key}
            paddingBottom={2}
            paddingTop={2}
            paddingX={3}
          >
            <Flex align="flex-start" columnGap={4} minW={0} width="full">
              <VStack align="stretch" flex={1} gap={1} minW={0} width="full">
                <Flex align="center" columnGap={4} minW={0} width="full">
                  <HStack columnGap={2} flexShrink={0} minW={0}>
                    <Skeleton borderRadius="full" flexShrink={0} height="8px" width="8px" />
                    <Skeleton flexShrink={0} height="4" maxW="120px" width="120px" />
                  </HStack>
                  <Flex align="center" columnGap={3} flex={1} minW={0}>
                    <Skeleton flexShrink={0} height="5" maxW="72px" rounded="md" width="18%" />
                    <Skeleton flex={1} height="4" minW={0} />
                  </Flex>
                </Flex>
                <HStack align="flex-start" columnGap={2} width="full">
                  <Box flexShrink={0} width="12px" />
                  <Skeleton flex={1} height="4" minW={0} />
                </HStack>
              </VStack>
              <Skeleton flexShrink={0} height="4" width="20" />
            </Flex>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}
