import { describe, expect, it } from "vitest";

import { getDevelopmentLabRoute } from "@/integrations/development-lab";

describe("development lab route", () => {
  it("injects the lab only for the development server", () => {
    const route = getDevelopmentLabRoute("dev");

    expect(route).toMatchObject({ pattern: "/lab" });
    expect(route?.entrypoint).toBeInstanceOf(URL);
    expect(route?.entrypoint.pathname.endsWith("/src/lab/LabPage.astro")).toBe(
      true,
    );
  });

  it.each(["build", "preview", "sync"] as const)(
    "does not inject the lab during %s",
    (command) => {
      expect(getDevelopmentLabRoute(command)).toBeNull();
    },
  );
});
