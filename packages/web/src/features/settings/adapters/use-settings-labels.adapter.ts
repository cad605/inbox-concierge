import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { useCallback } from "react";

import type { SettingsLabel } from "#features/settings/domain/types.ts";
import type {
  UseRefetchSettingsLabels,
  UseSettingsLabelsRows,
  UseToggleSettingsLabelActive,
} from "#features/settings/ports/settings.port.ts";
import { labelCollection } from "#infrastructure/collections/labels.ts";

export const useSettingsLabelsRows: UseSettingsLabelsRows = (): ReadonlyArray<SettingsLabel> => {
  const { data } = useLiveSuspenseQuery((q) => q.from({ label: labelCollection }), []);
  return data;
};

export const useRefetchSettingsLabels: UseRefetchSettingsLabels = (): (() => void) => {
  return useCallback(() => {
    void labelCollection.utils.refetch();
  }, []);
};

export const useToggleSettingsLabelActive: UseToggleSettingsLabelActive = (): ((
  label: SettingsLabel,
  checked: boolean,
) => Promise<void>) => {
  return useCallback(async (label, checked) => {
    const tx = labelCollection.update(label.id, (draft) => {
      draft.isActive = checked;
    });
    await tx.isPersisted.promise;
  }, []);
};
