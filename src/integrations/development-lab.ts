import type { AstroIntegration } from "astro";

type AstroCommand = Parameters<
  NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
>[0]["command"];

export function developmentLab(): AstroIntegration {
  return {
    name: "sky-lu-development-lab",
    hooks: {
      "astro:config:setup": ({ command, injectRoute }) => {
        for (const route of getDevelopmentLabRoutes(command))
          injectRoute(route);
      },
    },
  };
}

export function getDevelopmentLabRoutes(command: AstroCommand) {
  if (command !== "dev") return [];

  return [
    {
      pattern: "/lab",
      entrypoint: new URL("../lab/LabPage.astro", import.meta.url),
    },
    {
      pattern: "/lab/blueprint/[example]",
      entrypoint: new URL("../lab/BlueprintPage.astro", import.meta.url),
    },
    {
      pattern: "/lab/content/[example]",
      entrypoint: new URL("../lab/ContentPage.astro", import.meta.url),
    },
    {
      pattern: "/lab/underline",
      entrypoint: new URL("../lab/SketchUnderlinePage.astro", import.meta.url),
    },
    {
      pattern: "/lab/turntable",
      entrypoint: new URL("../lab/TurntablePage.astro", import.meta.url),
    },
    {
      pattern: "/lab/guitar",
      entrypoint: new URL("../lab/GuitarPage.astro", import.meta.url),
    },
    {
      pattern: "/lab/timeline",
      entrypoint: new URL("../lab/TimelinePage.astro", import.meta.url),
    },
  ];
}
