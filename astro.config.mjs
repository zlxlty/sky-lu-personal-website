import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

import { developmentLab } from "./src/integrations/development-lab";

export default defineConfig({
  output: "static",
  integrations: [mdx(), react(), developmentLab()],
  vite: {
    plugins: [tailwindcss()],
  },
});
