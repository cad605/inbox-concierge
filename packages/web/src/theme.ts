import { createSystem, defaultConfig } from "@chakra-ui/react";

export const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      colorPalette: "black",
      cursor: "default",
    },
  },
  theme: {
    semanticTokens: {
      radii: {
        l1: { value: "0.5rem" },
        l2: { value: "0.75rem" },
        l3: { value: "1rem" },
      },
    },
    tokens: {
      cursor: {
        button: { value: "default" },
        checkbox: { value: "default" },
        disabled: { value: "default" },
        menuitem: { value: "default" },
        option: { value: "default" },
        radio: { value: "default" },
        slider: { value: "default" },
        switch: { value: "default" },
      },
      fonts: {
        body: { value: "var(--font-inter)" },
      },
    },
  },
});
