import { preview } from "astro";

// Use Astro's static routing (including directory indexes and 404.html) without
// the CLI's shared dev-server lock. Port validation lives in browser-server.ts.
const server = await preview({
  server: { host: "127.0.0.1", port: Number(process.argv[2]) },
  vite: { preview: { strictPort: true } },
});

process.once("SIGTERM", () => {
  void server.stop();
});
