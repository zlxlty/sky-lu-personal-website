import { describe, expect, it } from "vitest";

import { getDevelopmentLabRoutes } from "@/integrations/development-lab";

describe("development lab route", () => {
  it("injects the lab only for the development server", () => {
    const [route, blueprintRoute, contentRoute, underlineRoute] =
      getDevelopmentLabRoutes("dev");

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
    expect(contentRoute).toMatchObject({ pattern: "/lab/content/[example]" });
    expect(
      contentRoute?.entrypoint.pathname.endsWith("/src/lab/ContentPage.astro"),
    ).toBe(true);
    expect(underlineRoute).toMatchObject({ pattern: "/lab/underline" });
    expect(
      underlineRoute?.entrypoint.pathname.endsWith(
        "/src/lab/SketchUnderlinePage.astro",
      ),
    ).toBe(true);
  });

  it("provides a dedicated guitar audition in development", () => {
    expect(getDevelopmentLabRoutes("dev")).toContainEqual({
      pattern: "/lab/guitar",
      entrypoint: new URL("../../src/lab/GuitarPage.astro", import.meta.url),
    });
  });

  it.each(["build", "preview", "sync"] as const)(
    "does not inject the lab during %s",
    (command) => {
      expect(getDevelopmentLabRoutes(command)).toEqual([]);
    },
  );
});
