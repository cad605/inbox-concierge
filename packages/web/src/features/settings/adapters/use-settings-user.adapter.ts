import type { SettingsUser } from "#features/settings/domain/types.ts";
import type { UseSettingsUser } from "#features/settings/ports/settings.port.ts";
import { useAuthUser } from "#infrastructure/hooks/use-auth.ts";

export const useSettingsUser: UseSettingsUser = (): SettingsUser | null => {
  return useAuthUser();
};
