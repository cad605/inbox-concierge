import type { UseSyncInboxResult } from "#features/inbox/ports/inbox.port.ts";
import type { ShellUser } from "#features/shell/domain/types.ts";

export type { ShellUser } from "#features/shell/domain/types.ts";

export type UseShellUser = () => ShellUser | null;

export type UseSyncInbox = () => UseSyncInboxResult;

export type ShellPorts = {
  readonly useShellUser: UseShellUser;
  readonly useSyncInbox: UseSyncInbox;
};
