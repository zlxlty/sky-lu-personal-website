import { defineConfig, devices } from "@playwright/test";

import { createBrowserServer } from "./tests/support/browser-server";

const { baseURL, webServer } = createBrowserServer(
  "e2e",
  process.env.PLAYWRIGHT_E2E_PORT,
);
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? "github" : "list",
  outputDir: "test-results/e2e",
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
    {
      name: "webkit-mobile",
      testMatch: ["guitar-mobile.spec.ts", "recording-delivery.spec.ts"],
      use: { ...devices["iPhone 13"] },
    },
  ],
  webServer,
});
