import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import { developmentLab } from "./src/integrations/development-lab";

export default defineConfig({
  output: "static",
  integrations: [mdx(), react(), developmentLab()],
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    },
  },
  vite: {
    // Lazy interactions must not trigger Vite's first-use dependency reload.
    optimizeDeps: { include: ["animejs/waapi", "tone"] },
    plugins: [tailwindcss()],
  },
});
