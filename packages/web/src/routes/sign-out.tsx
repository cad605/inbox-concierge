import { createFileRoute } from "@tanstack/react-router";

import { signOutAndRedirect } from "#features/auth/sign-out.ts";

export const Route = createFileRoute("/sign-out")({
  onEnter: () => {
    signOutAndRedirect();
  },
});
