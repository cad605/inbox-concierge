import { m } from "$paraglide/messages.js";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import { AutoLabelsSection } from "#features/settings/auto-labels-section.tsx";
import { ProfileSection } from "#features/settings/profile-section.tsx";

export function SettingsPage() {
  return (
    <Flex flex={1} flexDirection="column" height="full" minH={0}>
      <Box flex={1} minH={0} overflowY="auto">
        <Stack gap={8}>
          <Stack gap={1}>
            <Heading size="lg">{m.settings_title()}</Heading>
            <Text color="fg.muted">{m.settings_description()}</Text>
          </Stack>

          <ProfileSection />
          <AutoLabelsSection />
        </Stack>
      </Box>
    </Flex>
  );
}
