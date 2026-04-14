import { useLiveSuspenseQuery } from "@tanstack/react-db";

import type {
  SettingsThreadsForLabelWizardQuery,
  UseSettingsThreadsForLabelWizard,
} from "#features/settings/ports/settings.port.ts";
import { threadCollection } from "#infrastructure/collections/threads.ts";

export const useSettingsThreadsForLabelWizard: UseSettingsThreadsForLabelWizard = () => {
  return useLiveSuspenseQuery(
    (q) =>
      q.from({ thread: threadCollection }).orderBy(({ thread }) => thread.lastMessageAt, "desc"),
    [],
  ) as SettingsThreadsForLabelWizardQuery;
};
