import { queryOptions } from "@tanstack/react-query";

import { api } from "#infrastructure/api-client.ts";
import { authKeys } from "#infrastructure/query-keys.ts";

export const authMeQueryOptions = () =>
  queryOptions({
    queryKey: authKeys.me,
    queryFn: async () => {
      const { data, response } = await api.GET("/api/auth/me");

      if (response.status === 401) {
        return null;
      }

      return data ?? null;
    },
  });
