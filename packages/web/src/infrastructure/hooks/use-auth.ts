import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { components } from "@workspace/http/schema";

import { api } from "#infrastructure/api-client.ts";
import { authMeQueryOptions } from "#infrastructure/queries/me-query.ts";
import { authKeys } from "#infrastructure/query-keys.ts";

export type AuthUser = components["schemas"]["AuthUser"];

export type UserRole = AuthUser["role"];

function useAuthMeQuery() {
  return useQuery(authMeQueryOptions());
}

export function useAuthUser(): AuthUser | null {
  return useAuthMeQuery().data ?? null;
}

export function useAuthRole(): UserRole {
  return useAuthMeQuery().data?.role ?? "user";
}

export function useSignOut(): () => Promise<void> {
  const queryClient = useQueryClient();

  const { mutateAsync } = useMutation({
    mutationFn: async () => {
      await api.POST("/api/auth/logout");
    },
    onSettled: () => {
      queryClient.setQueryData(authKeys.me, null);
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });

  return () => mutateAsync();
}
