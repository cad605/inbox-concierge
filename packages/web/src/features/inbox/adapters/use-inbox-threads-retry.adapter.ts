import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";

import { queryClient } from "#infrastructure/query-client.ts";
import { threadKeys } from "#infrastructure/query-keys.ts";

export function useInboxThreadsErrorRetry() {
  const router = useRouter();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: threadKeys.all });
    void router.invalidate();
  }, [router]);
}
