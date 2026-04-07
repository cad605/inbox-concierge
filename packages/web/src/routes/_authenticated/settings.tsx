import { createFileRoute } from "@tanstack/react-router";

import { SettingsPage } from "#features/settings/settings-page.tsx";
import { labelCollection } from "#infrastructure/collections/labels.ts";
import { threadCollection } from "#infrastructure/collections/threads.ts";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
  loader: async () => {
    await Promise.all([labelCollection.preload(), threadCollection.preload()]);
  },
  ssr: false,
});
