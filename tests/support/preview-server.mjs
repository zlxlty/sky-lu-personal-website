import process from "node:process";

import { preview } from "astro";

const server = await preview({
  server: {
    host: "127.0.0.1",
    port: 4322,
  },
});

const shutdown = async () => {
  await server.stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
