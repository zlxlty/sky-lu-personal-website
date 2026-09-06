import type { PlaywrightTestConfig } from "@playwright/test";

type BrowserSuite = "e2e" | "lab";

/** Keep the requested port, readiness URL, and launched server in agreement. */
export function createBrowserServer(
  suite: BrowserSuite,
  portOverride: string | undefined,
) {
  const port = Number(portOverride ?? (suite === "e2e" ? 4322 : 4323));
  if (
    (portOverride !== undefined && !/^\d+$/.test(portOverride)) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65535
  ) {
    throw new Error(
      `PLAYWRIGHT_${suite.toUpperCase()}_PORT must be an integer from 1 to 65535. Choose a free port for this worktree.`,
    );
  }

  const baseURL = `http://127.0.0.1:${port}`;
  const webServer = {
    command:
      suite === "e2e"
        ? `corepack pnpm build && node scripts/serve-preview.ts ${port}`
        : `node scripts/serve-lab.ts ${port}`,
    url: suite === "lab" ? `${baseURL}/lab` : baseURL,
    env: { NODE_ENV: suite === "e2e" ? "production" : "development" },
    reuseExistingServer: false,
    stdout: "pipe",
    timeout: 120_000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5_000 },
  } satisfies PlaywrightTestConfig["webServer"];

  return { baseURL, webServer };
}
