import { m } from "$paraglide/messages.js";
import { Box, Flex, Heading, Stack, Text } from "@chakra-ui/react";

import { AutoLabelsSection } from "#features/settings/auto-labels-section.tsx";
import { useSettings } from "#features/settings/context.tsx";
import { ProfileSection } from "#features/settings/ui/profile-section.tsx";

export function SettingsPage() {
  const { useSettingsUser } = useSettings();
  const user = useSettingsUser();

  return (
    <Flex flex={1} flexDirection="column" height="full" minH={0}>
      <Box flex={1} minH={0} overflowY="auto">
        <Stack gap={8}>
          <Stack gap={1}>
            <Heading size="lg">{m.settings_title()}</Heading>
            <Text color="fg.muted">{m.settings_description()}</Text>
          </Stack>

          <ProfileSection user={user} />
          <AutoLabelsSection user={user} />
        </Stack>
      </Box>
    </Flex>
  );
}
