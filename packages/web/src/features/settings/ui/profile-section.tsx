import { m } from "$paraglide/messages.js";
import { DataList, Heading, Stack, Text, useLocaleContext } from "@chakra-ui/react";
import type { components } from "@workspace/http/schema";

type SettingsUser = components["schemas"]["AuthUser"];

function primaryProviderLabel(provider: SettingsUser["primaryProvider"]): string {
  switch (provider) {
    case "google":
      return m.settings_profile_provider_google();
    default: {
      return provider;
    }
  }
}

export type ProfileSectionProps = {
  readonly user: SettingsUser | null;
};

export function ProfileSection({ user }: ProfileSectionProps) {
  const { locale } = useLocaleContext();

  const formatDateTime = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return iso;
    }
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  };

  if (user == null) {
    return null;
  }

  return (
    <Stack gap={6}>
      <Stack gap={1} maxW="2xl">
        <Heading size="md">{m.settings_profile_title()}</Heading>
        <Text color="fg.muted" fontSize="sm">
          {m.settings_profile_description()}
        </Text>
      </Stack>

      <DataList.Root maxW="3xl" orientation="horizontal" size="md">
        <DataList.Item>
          <DataList.ItemLabel>{m.settings_profile_label_display_name()}</DataList.ItemLabel>
          <DataList.ItemValue>{user.displayName}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{m.settings_profile_label_email()}</DataList.ItemLabel>
          <DataList.ItemValue>{user.email}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{m.settings_profile_label_primary_provider()}</DataList.ItemLabel>
          <DataList.ItemValue>{primaryProviderLabel(user.primaryProvider)}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{m.settings_profile_label_created_at()}</DataList.ItemLabel>
          <DataList.ItemValue>{formatDateTime(user.createdAt)}</DataList.ItemValue>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>{m.settings_profile_label_updated_at()}</DataList.ItemLabel>
          <DataList.ItemValue>{formatDateTime(user.updatedAt)}</DataList.ItemValue>
        </DataList.Item>
      </DataList.Root>
    </Stack>
  );
}
