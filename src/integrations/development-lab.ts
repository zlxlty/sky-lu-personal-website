import type { AstroIntegration } from "astro";

type AstroCommand = Parameters<
  NonNullable<AstroIntegration["hooks"]["astro:config:setup"]>
>[0]["command"];

const LAB_ROUTE_PATTERN = "/lab";

export function developmentLab(): AstroIntegration {
  return {
    name: "sky-lu-development-lab",
    hooks: {
      "astro:config:setup": ({ command, injectRoute }) => {
        const route = getDevelopmentLabRoute(command);
        if (route) injectRoute(route);
      },
    },
  };
}

export function getDevelopmentLabRoute(command: AstroCommand) {
  if (command !== "dev") return null;

  return {
    pattern: LAB_ROUTE_PATTERN,
    entrypoint: new URL("../lab/LabPage.astro", import.meta.url),
  };
}
