import { createContext, type ReactNode, use } from "react";

import { createSettingsLabelRequest } from "#features/settings/adapters/settings-create-label.adapter.ts";
import { useRefetchThreadCollection as useRefetchThreadCollectionApi } from "#features/settings/adapters/use-refetch-thread-collection.adapter.ts";
import {
  useRefetchSettingsLabels as useRefetchSettingsLabelsApi,
  useSettingsLabelsRows as useSettingsLabelsRowsApi,
  useToggleSettingsLabelActive as useToggleSettingsLabelActiveApi,
} from "#features/settings/adapters/use-settings-labels.adapter.ts";
import { useSettingsThreadsForLabelWizard as useSettingsThreadsForLabelWizardApi } from "#features/settings/adapters/use-settings-threads-for-label-dialog.adapter.ts";
import { useSettingsUser as useSettingsUserApi } from "#features/settings/adapters/use-settings-user.adapter.ts";
import type { SettingsPorts } from "#features/settings/ports/settings.port.ts";

const SettingsContext = createContext<SettingsPorts | null>(null);

export const useSettings = (): SettingsPorts => {
  const context = use(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

type SettingsProviderProps = {
  readonly children: ReactNode;
  readonly adapters?: Partial<SettingsPorts>;
};

export const SettingsProvider = ({ children, adapters }: SettingsProviderProps) => {
  const value: SettingsPorts = {
    useSettingsUser: adapters?.useSettingsUser ?? useSettingsUserApi,
    useSettingsLabelsRows: adapters?.useSettingsLabelsRows ?? useSettingsLabelsRowsApi,
    useRefetchSettingsLabels: adapters?.useRefetchSettingsLabels ?? useRefetchSettingsLabelsApi,
    useToggleSettingsLabelActive:
      adapters?.useToggleSettingsLabelActive ?? useToggleSettingsLabelActiveApi,
    useRefetchThreadCollection:
      adapters?.useRefetchThreadCollection ?? useRefetchThreadCollectionApi,
    useSettingsThreadsForLabelWizard:
      adapters?.useSettingsThreadsForLabelWizard ?? useSettingsThreadsForLabelWizardApi,
    createSettingsLabel: adapters?.createSettingsLabel ?? createSettingsLabelRequest,
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
};
