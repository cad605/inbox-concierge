import type { ShellUser } from "#features/shell/domain/types.ts";
import { useAuthUser } from "#infrastructure/hooks/use-auth.ts";

export function useShellUser(): ShellUser | null {
  return useAuthUser();
}
