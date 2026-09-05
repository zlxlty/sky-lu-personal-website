import { defineConfig, devices } from "@playwright/test";

import { createBrowserServer } from "./tests/support/browser-server";

const { baseURL, webServer } = createBrowserServer(
  "lab",
  process.env.PLAYWRIGHT_LAB_PORT,
);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/lab",
  fullyParallel: false,
  forbidOnly: isCI,
  retries: 0,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/lab",
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
  webServer,
});
