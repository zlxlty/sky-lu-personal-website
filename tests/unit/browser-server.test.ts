import { describe, expect, it } from "vitest";

import { createBrowserServer } from "../support/browser-server";

describe("browser test server configuration", () => {
  it("owns separate servers for production and lab verification", () => {
    const production = createBrowserServer("e2e", undefined);
    const lab = createBrowserServer("lab", undefined);

    expect(production.baseURL).toBe("http://127.0.0.1:4322");
    expect(production.webServer.url).toBe(production.baseURL);
    expect(production.webServer.command).toContain("pnpm build &&");
    expect(production.webServer.command).toContain("--port 4322 --strictPort");
    expect(lab.baseURL).toBe("http://127.0.0.1:4323");
    expect(lab.webServer.url).toBe(`${lab.baseURL}/lab`);
    expect(lab.webServer.command).toBe("node scripts/serve-lab.ts 4323");
    expect(production.webServer.reuseExistingServer).toBe(false);
    expect(lab.webServer.reuseExistingServer).toBe(false);
    expect(production.webServer.env.NODE_ENV).toBe("production");
    expect(lab.webServer.env.NODE_ENV).toBe("development");
  });

  it.each(["e2e", "lab"] as const)(
    "uses the %s port override in both the server and browser target",
    (suite) => {
      const { baseURL, webServer } = createBrowserServer(suite, "54321");

      expect(baseURL).toBe("http://127.0.0.1:54321");
      expect(webServer.url).toBe(suite === "lab" ? `${baseURL}/lab` : baseURL);
      expect(webServer.command).toContain("54321");
    },
  );

  it.each(["", "0", "65536", "1.5", "-1", " 4321", "4321; exit 0"])(
    "rejects an invalid port override (%j) before launching a shell",
    (port) => {
      expect(() => createBrowserServer("lab", port)).toThrow(
        "PLAYWRIGHT_LAB_PORT must be an integer from 1 to 65535",
      );
      expect(() => createBrowserServer("e2e", port)).toThrow(
        "PLAYWRIGHT_E2E_PORT must be an integer from 1 to 65535",
      );
    },
  );
});
