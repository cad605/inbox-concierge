import { Presence } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  show: boolean;
}>;

export function AnimateIn({ children, show }: Props) {
  return (
    <Presence animationDuration="moderate" animationName={{ _open: "fade-in" }} present={show}>
      {children}
    </Presence>
  );
}
