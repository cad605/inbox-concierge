import { createContext, type ReactNode, use } from "react";

import { useSyncInbox as useSyncInboxApi } from "#features/inbox/adapters/use-sync-inbox.adapter.ts";
import { useShellUser as useShellUserApi } from "#features/shell/adapters/use-shell-user.adapter.ts";
import type { ShellPorts } from "#features/shell/ports/shell.port.ts";

const ShellContext = createContext<ShellPorts | null>(null);

export const useShell = (): ShellPorts => {
  const context = use(ShellContext);
  if (!context) {
    throw new Error("useShell must be used within ShellProvider");
  }
  return context;
};

type ShellProviderProps = {
  readonly children: ReactNode;
  readonly adapters?: Partial<ShellPorts>;
};

export const ShellProvider = ({ children, adapters }: ShellProviderProps) => {
  const value: ShellPorts = {
    useShellUser: adapters?.useShellUser ?? useShellUserApi,
    useSyncInbox: adapters?.useSyncInbox ?? useSyncInboxApi,
  };

  return <ShellContext value={value}>{children}</ShellContext>;
};
