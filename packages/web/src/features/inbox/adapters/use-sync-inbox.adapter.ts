import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { UseSyncInboxResult } from "#features/inbox/ports/inbox.port.ts";
import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { authKeys, threadKeys } from "#infrastructure/query-keys.ts";

export function useSyncInbox(): UseSyncInboxResult {
  const queryClient = useQueryClient();

  const { mutate, isPending, isError, error, reset } = useMutation({
    mutationFn: async () => {
      const { error: apiError, response } = await api.POST("/api/threads/sync");
      if (!response.ok) {
        throw new Error(getErrorMessage(apiError));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.pendingJobs });
    },
  });

  return {
    mutate: () => {
      mutate();
    },
    isPending,
    isError,
    error: error instanceof Error ? error : error != null ? new Error(String(error)) : null,
    reset,
  };
}
