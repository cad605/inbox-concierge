import { api } from "#infrastructure/api-client.ts";
import { queryClient } from "#infrastructure/query-client.ts";
import { authKeys } from "#infrastructure/query-keys.ts";
import { toaster } from "#ui/toaster.tsx";

export async function signOutAndRedirect(): Promise<void> {
  const id = toaster.create({
    title: "We're signing you out...",
    type: "loading",
  });

  await api.POST("/api/auth/logout");

  queryClient.setQueryData(authKeys.me, null);

  await queryClient.invalidateQueries({ queryKey: authKeys.all });

  toaster.update(id, {
    title: "You've been signed out.",
    type: "success",
  });

  window.location.assign("/sign-in");
}
