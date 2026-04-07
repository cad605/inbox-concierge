import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authMeQueryOptions } from "#infrastructure/queries/me-query.ts";

export const Route = createFileRoute("/_public")({
  beforeLoad: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(authMeQueryOptions());

    if (user) {
      throw redirect({ to: "/" });
    }
  },
  component: PublicLayout,
});

function PublicLayout() {
  return <Outlet />;
}
