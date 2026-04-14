import type {
  SettingsLabel,
  SettingsLabelWizardThreadRow,
  SettingsUser,
} from "#features/settings/domain/types.ts";

export type {
  SettingsLabel,
  SettingsLabelWizardThreadRow,
  SettingsUser,
} from "#features/settings/domain/types.ts";

export type UseSettingsUser = () => SettingsUser | null;

export type UseSettingsLabelsRows = () => ReadonlyArray<SettingsLabel>;

export type UseRefetchSettingsLabels = () => () => void;

export type UseToggleSettingsLabelActive = () => (
  label: SettingsLabel,
  checked: boolean,
) => Promise<void>;

export type UseRefetchThreadCollection = () => () => void;

export type SettingsThreadsForLabelWizardQuery = {
  readonly data: ReadonlyArray<SettingsLabelWizardThreadRow>;
};

export type UseSettingsThreadsForLabelWizard = () => SettingsThreadsForLabelWizardQuery;

export type CreateSettingsLabelBody = {
  readonly name: string;
  readonly prompt: string | null;
  readonly examples?: ReadonlyArray<string>;
};

export type CreateSettingsLabelResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly message: string };

export type CreateSettingsLabel = (
  body: CreateSettingsLabelBody,
) => Promise<CreateSettingsLabelResult>;

export type SettingsPorts = {
  readonly useSettingsUser: UseSettingsUser;
  readonly useSettingsLabelsRows: UseSettingsLabelsRows;
  readonly useRefetchSettingsLabels: UseRefetchSettingsLabels;
  readonly useToggleSettingsLabelActive: UseToggleSettingsLabelActive;
  readonly useRefetchThreadCollection: UseRefetchThreadCollection;
  readonly useSettingsThreadsForLabelWizard: UseSettingsThreadsForLabelWizard;
  readonly createSettingsLabel: CreateSettingsLabel;
};
