import { Button, Link as ChakraLink } from "@chakra-ui/react";
import { createLink } from "@tanstack/react-router";
import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

export const Link = createLink(ChakraLink);

type Props = PropsWithChildren<Omit<ComponentPropsWithoutRef<typeof Link>, "href">>;

export function LinkButton({ children, ...props }: Props) {
  return (
    <Button asChild variant="ghost">
      <Link {...props}>{children}</Link>
    </Button>
  );
}
