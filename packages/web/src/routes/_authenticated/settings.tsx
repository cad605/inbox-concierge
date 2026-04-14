import { createFileRoute } from "@tanstack/react-router";

import { SettingsProvider } from "#features/settings/context.tsx";
import { SettingsPage } from "#features/settings/settings-page.tsx";
import { labelCollection } from "#infrastructure/collections/labels.ts";
import { threadCollection } from "#infrastructure/collections/threads.ts";

function SettingsLayout() {
  return (
    <SettingsProvider>
      <SettingsPage />
    </SettingsProvider>
  );
}

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsLayout,
  loader: async () => {
    await Promise.all([labelCollection.preload(), threadCollection.preload()]);
  },
  ssr: false,
});
