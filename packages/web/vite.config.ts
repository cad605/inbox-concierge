// vite.config.ts

import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    paraglideVitePlugin({
      outdir: "./src/infrastructure/paraglide",
      project: "./src/infrastructure/i18n/project.inlang",
    }),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tanstackRouter({
      autoCodeSplitting: true,
      target: "react",
    }),
    react(),
  ],
  preview: {
    allowedHosts: ["inbox-concierge-web.fly.dev"],
  },
});
