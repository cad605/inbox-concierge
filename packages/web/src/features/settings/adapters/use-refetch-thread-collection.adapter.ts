import { useCallback } from "react";

import type { UseRefetchThreadCollection } from "#features/settings/ports/settings.port.ts";
import { threadCollection } from "#infrastructure/collections/threads.ts";

export const useRefetchThreadCollection: UseRefetchThreadCollection = (): (() => void) => {
  return useCallback(() => {
    void threadCollection.utils.refetch();
  }, []);
};
