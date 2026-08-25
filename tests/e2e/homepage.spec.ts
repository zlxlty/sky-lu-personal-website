import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage satisfies the production smoke contract", async ({ page }) => {
  const response = await page.goto("/");
  const accessibility = await new AxeBuilder({ page }).analyze();

  expect({
    status: response?.status(),
    title: await page.title(),
    heading: await page.getByRole("heading", { level: 1 }).textContent(),
    accessibilityViolations: accessibility.violations.map(({ id }) => id),
  }).toEqual({
    status: 200,
    title: "Sky Lu",
    heading: "Sky Lu",
    accessibilityViolations: [],
  });
});

test("homepage serves both visual themes and local typography", async ({
  page,
}) => {
  const fontResponses = new Map<string, number>();
  const fontOrigins = new Set<string>();
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.endsWith(".woff2")) {
      fontResponses.set(url.pathname, response.status());
      fontOrigins.add(url.origin);
    }
  });

  await page.goto("/");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  const light = await readTheme(page);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const dark = await readTheme(page);

  expect(light).toEqual({
    background: "rgb(243, 239, 232)",
    color: "rgb(43, 39, 36)",
    sansLoaded: true,
    monoLoaded: true,
  });
  expect(dark).toEqual({
    background: "rgb(33, 30, 27)",
    color: "rgb(238, 231, 220)",
    sansLoaded: true,
    monoLoaded: true,
  });
  expect(Object.fromEntries(fontResponses)).toMatchObject({
    "/fonts/ibm-plex-mono-latin.woff2": 200,
    "/fonts/ibm-plex-sans-latin.woff2": 200,
  });
  expect(
    [...fontResponses.keys()].every((path) => path.startsWith("/fonts/")),
  ).toBe(true);
  expect([...fontOrigins]).toEqual([new URL(page.url()).origin]);
});

async function readTheme(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);

    return {
      background: root.backgroundColor,
      color: root.color,
      sansLoaded: document.fonts.check('16px "IBM Plex Sans"'),
      monoLoaded: document.fonts.check('16px "IBM Plex Mono"'),
    };
  });
}
