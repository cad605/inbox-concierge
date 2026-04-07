import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "#infrastructure/api-client.ts";
import { getErrorMessage } from "#infrastructure/api-errors.ts";
import { authKeys, threadKeys } from "#infrastructure/query-keys.ts";
import { toaster } from "#ui/toaster.tsx";

export function useSyncInbox() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error, response } = await api.POST("/api/threads/sync");
      if (!response.ok) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: threadKeys.all });
      queryClient.invalidateQueries({ queryKey: authKeys.pendingJobs });
    },
    onError: (err: unknown) => {
      toaster.create({ title: getErrorMessage(err), type: "error" });
    },
  });
}
