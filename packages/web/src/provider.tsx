import { ChakraProvider, LocaleProvider } from "@chakra-ui/react";
import type { PropsWithChildren } from "react";

import { system } from "#theme.ts";
import { ColorModeProvider } from "#ui/color-mode.tsx";
import { Toaster } from "#ui/toaster.tsx";

type Props = PropsWithChildren;

const defaultLocale =
  typeof globalThis.navigator !== "undefined" ? globalThis.navigator.language : "en-US";

export function Provider({ children }: Props) {
  return (
    <ChakraProvider value={system}>
      <LocaleProvider locale={defaultLocale}>
        <ColorModeProvider>
          {children}
          <Toaster />
        </ColorModeProvider>
      </LocaleProvider>
    </ChakraProvider>
  );
}
