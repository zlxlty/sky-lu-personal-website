import { defineConfig, devices } from "@playwright/test";

const baseURL = "http://127.0.0.1:4321";
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
    ...devices["Desktop Chrome"],
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
    command: "corepack pnpm exec astro dev --host 127.0.0.1 --port 4321",
    url: `${baseURL}/lab`,
    reuseExistingServer: !isCI,
    stdout: "pipe",
    timeout: 120_000,
  },
});
