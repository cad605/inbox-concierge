import { createFileRoute, redirect } from "@tanstack/react-router";

import { InboxProvider } from "#features/inbox/context.tsx";
import { AuthenticatedShell } from "#features/shell/authenticated-shell.tsx";
import { ShellProvider } from "#features/shell/context.tsx";
import { pendingJobsCollection } from "#infrastructure/collections/pending-jobs.ts";
import { authMeQueryOptions } from "#infrastructure/queries/me-query.ts";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(authMeQueryOptions());

    if (!user) {
      throw redirect({
        search: {
          redirect: location.href,
        },
        to: "/sign-in",
      });
    }
  },
  component: AuthenticatedLayout,
  loader: async () => {
    await pendingJobsCollection.preload();
  },
  ssr: false,
});

function AuthenticatedLayout() {
  return (
    <InboxProvider>
      <ShellProvider>
        <AuthenticatedShell />
      </ShellProvider>
    </InboxProvider>
  );
}
