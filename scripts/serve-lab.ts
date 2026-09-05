import { dev } from "astro";

// The Playwright configuration validates this port before launching the process.
// The programmatic API leaves the developer's Astro CLI server and lock untouched.
const server = await dev({
  server: { host: "127.0.0.1", port: Number(process.argv[2]) },
  vite: {
    cacheDir: "node_modules/.cache/playwright-lab",
    server: { strictPort: true },
  },
});

process.once("SIGTERM", () => {
  void server.stop();
});
