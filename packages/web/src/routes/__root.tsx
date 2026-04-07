/// <reference types="vite/client" />

import { m } from "$paraglide/messages.js";
import { Container, Flex } from "@chakra-ui/react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { queryClient } from "#infrastructure/query-client.ts";
import { NotFound } from "#ui/not-found.tsx";

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />

      <Flex height="100vh" overflow="hidden" userSelect="none" width="100vw">
        <Container
          display="flex"
          flexDirection="column"
          fluid={true}
          height="full"
          minH={0}
          paddingBlock={2}
          paddingInline={4}
          width="full"
        >
          <Flex flex={1} flexDirection="column" minH={0} width="full">
            <Outlet />
          </Flex>
        </Container>
      </Flex>

      <Scripts />

      {import.meta.env.DEV ? (
        <>
          <ReactQueryDevtools />
          <TanStackRouterDevtools position="bottom-right" />
        </>
      ) : null}
    </QueryClientProvider>
  );
}

export type RouterContext = {
  queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
  head: () => ({
    links: [
      {
        href: "/favicon.ico",
        rel: "icon",
      },
    ],
    meta: [
      {
        content: m.app_description(),
        name: "description",
      },
      {
        title: m.app_name(),
      },
    ],
  }),
  notFoundComponent: NotFound,
});
