import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4322";
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? "github" : "list",
  outputDir: "test-results",
  preserveOutput: "failures-only",
  use: {
    baseURL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "corepack pnpm build && node tests/support/preview-server.mjs",
    url: baseURL,
    reuseExistingServer: false,
    stdout: "pipe",
    timeout: 120_000,
  },
});
