import { describe, expect, it } from "vitest";

import { getDevelopmentLabRoutes } from "@/integrations/development-lab";

describe("development lab route", () => {
  it("injects the lab only for the development server", () => {
    const [route, blueprintRoute] = getDevelopmentLabRoutes("dev");

    expect(route).toMatchObject({ pattern: "/lab" });
    expect(route?.entrypoint).toBeInstanceOf(URL);
    expect(route?.entrypoint.pathname.endsWith("/src/lab/LabPage.astro")).toBe(
      true,
    );
    expect(blueprintRoute).toMatchObject({
      pattern: "/lab/blueprint/[example]",
    });
    expect(
      blueprintRoute?.entrypoint.pathname.endsWith(
        "/src/lab/BlueprintPage.astro",
      ),
    ).toBe(true);
  });

  it.each(["build", "preview", "sync"] as const)(
    "does not inject the lab during %s",
    (command) => {
      expect(getDevelopmentLabRoutes(command)).toEqual([]);
    },
  );
});
