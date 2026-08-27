import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { THEME_COLORS } from "@/lib/theme";

const tokensSource = await readFile(resolve("src/styles/tokens.css"), "utf8");
const fontsSource = await readFile(resolve("src/styles/fonts.css"), "utf8");
const blueprintSource = await readFile(
  resolve("src/styles/blueprint.css"),
  "utf8",
);
const packageManifest = JSON.parse(
  await readFile(resolve("package.json"), "utf8"),
) as { dependencies?: Record<string, string> };

const lightTokens = extractTokens(extractRule(":root"));
const darkTokens = extractTokens(extractRule('[data-theme="dark"]'));
const systemDarkTokens = extractTokens(extractRule(":root:not([data-theme])"));

describe.each([
  ["light", lightTokens],
  ["dark", darkTokens],
] as const)("%s design tokens", (_theme, tokens) => {
  it("keeps readable text and links above WCAG AA contrast", () => {
    expect(
      contrast(tokens["--color-ink"], tokens["--color-paper"]),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(tokens["--color-muted"], tokens["--color-paper"]),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(tokens["--color-link"], tokens["--color-paper"]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps focus and brass foreground pairs visible", () => {
    expect(
      contrast(tokens["--color-focus"], tokens["--color-paper"]),
    ).toBeGreaterThanOrEqual(3);
    expect(
      contrast(tokens["--color-on-brass"], tokens["--color-brass"]),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps danger text and emphasis content above WCAG AA contrast", () => {
    expect(
      contrast(tokens["--color-danger"], tokens["--color-paper"]),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(tokens["--color-on-danger"], tokens["--color-danger-emphasis"]),
    ).toBeGreaterThanOrEqual(4.5);
  });
});

describe("self-hosted typography", () => {
  it("references only local WOFF2 font assets", async () => {
    const urls = [...fontsSource.matchAll(/url\("([^"]+)"\)/g)].map(
      ([, url]) => url,
    );

    expect(urls).toHaveLength(4);
    expect(
      urls.every((url) => url.startsWith("/fonts/") && url.endsWith(".woff2")),
    ).toBe(true);

    for (const url of urls) {
      const asset = await stat(resolve("public", url.slice(1)));
      expect(asset.size).toBeGreaterThan(0);
    }
  });

  it("assigns self-hosted Geist to the heading role", () => {
    expect(fontsSource).toContain(
      '@import "@fontsource-variable/geist/wght.css";',
    );
    expect(packageManifest.dependencies?.["@fontsource-variable/geist"]).toBe(
      "5.3.0",
    );
    expect(tokensSource).toContain(
      '--font-heading-family: "Geist Variable", var(--font-sans);',
    );
    expect(blueprintSource).toContain(
      "--font-heading: var(--font-heading-family);",
    );
  });
});

describe("Tailwind-first spacing", () => {
  it("does not maintain a parallel numeric spacing scale", () => {
    expect(tokensSource).not.toMatch(/--space-\d+:/);
  });
});

describe("browser theme surfaces", () => {
  it("keeps metadata colors aligned with the paper tokens", () => {
    expect(lightTokens["--color-paper"]).toBe(THEME_COLORS.light);
    expect(darkTokens["--color-paper"]).toBe(THEME_COLORS.dark);
  });

  it("uses the approved light and dark color pairs", () => {
    expect(lightTokens["--color-paper"]).toBe("#fcf3e6");
    expect(lightTokens["--color-ink"]).toBe("#38332f");
    expect(darkTokens["--color-paper"]).toBe("#2b2724");
    expect(darkTokens["--color-ink"]).toBe("#ae9877");
  });

  it("uses distinct foreground and emphasis roles for danger", () => {
    expect(lightTokens["--color-danger"]).toBe("#923b33");
    expect(lightTokens["--color-danger-emphasis"]).toBe("#96372f");
    expect(lightTokens["--color-on-danger"]).toBe("#fcf3e6");
    expect(lightTokens["--color-on-danger"]).toBe(lightTokens["--color-paper"]);
    expect(darkTokens["--color-danger"]).toBe("#b98279");
    expect(darkTokens["--color-danger-emphasis"]).toBe("#82443d");
    expect(darkTokens["--color-on-danger"]).toBe("#e7d6be");
  });

  it("keeps the no-JavaScript system fallback aligned with dark mode", () => {
    expect(systemDarkTokens).toEqual(darkTokens);
  });
});

function extractRule(selector: string): string {
  const start = tokensSource.indexOf(`${selector} {`);
  if (start < 0) {
    throw new Error(`Missing CSS rule: ${selector}`);
  }

  const bodyStart = tokensSource.indexOf("{", start) + 1;
  const bodyEnd = tokensSource.indexOf("\n}", bodyStart);
  if (bodyEnd < 0) {
    throw new Error(`Unclosed CSS rule: ${selector}`);
  }

  return tokensSource.slice(bodyStart, bodyEnd);
}

function extractTokens(rule: string): Record<string, string> {
  return Object.fromEntries(
    [...rule.matchAll(/(--[\w-]+):\s*(#[\da-f]{6});/gi)].map(
      ([, name, value]) => [name, value],
    ),
  );
}

function contrast(foreground: string, background: string): number {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort(
    (a, b) => b - a,
  );
  return (lighter + 0.05) / (darker + 0.05);
}

function luminance(hex: string): number {
  const pairs = hex.slice(1).match(/.{2}/g);
  if (pairs?.length !== 3) {
    throw new Error(`Invalid six-digit hex color: ${hex}`);
  }

  const [red, green, blue] = pairs
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
    );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
