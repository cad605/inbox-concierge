import { createRouteMask, createRouter } from "@tanstack/react-router";

import { queryClient } from "#infrastructure/query-client.ts";
import { NotFound } from "#ui/not-found.tsx";

import { routeTree } from "./routeTree.gen";

/**
 * Hides `redirect` search param from the sign-in route in the URL bar.
 */
const signInRouteMask = createRouteMask({
  from: "/sign-in",
  routeTree,
  search: { redirect: undefined },
  to: "/sign-in",
});

export const router = createRouter({
  context: { queryClient },
  defaultNotFoundComponent: NotFound,
  defaultPreload: "intent",
  defaultPreloadGcTime: 0,
  defaultPreloadStaleTime: 0,
  defaultStaleTime: 5000,
  routeMasks: [signInRouteMask],
  routeTree,
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
