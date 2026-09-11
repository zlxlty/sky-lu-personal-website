import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { inspectBlueprintRules } from "../support/blueprint-rules";
import { showStaticTheme, storeTheme } from "../support/theme";

const regions =
  '[data-slot="panel"], [data-slot="panel-header"], [data-slot="panel-body"], [data-slot="panel-rule-band"], [data-slot="stripe-separator"]';

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 768, 1440]) {
    test.describe(`${colorScheme} content at ${width}px without JavaScript`, () => {
      test.use({
        javaScriptEnabled: false,
        colorScheme,
        contextOptions: { reducedMotion: "reduce" },
        viewport: { width, height: 900 },
      });
      for (const path of ["/projects", "/projects/dynamic-pages", "/writing"]) {
        test(`${path} has one rail and one rule per boundary`, async ({
          page,
        }) => {
          await page.goto(path);
          await showStaticTheme(page, colorScheme);
          await page.evaluate(() => document.fonts.ready);
          await expect(page.locator("h1")).toHaveCount(1);
          await expect(page.locator("h1")).toHaveText(
            path === "/writing"
              ? "Writings"
              : path === "/projects"
                ? "Projects"
                : "Dynamic Pages",
          );
          await expect(page.locator("main")).toHaveCount(1);
          await expect(
            page.locator(
              '[data-slot="panel-header"]:has(h1) + [data-slot="stripe-separator"] + [data-slot="panel-rule-band"]',
            ),
          ).toHaveCount(1);
          await expect(page.locator("astro-island")).toHaveCount(0);
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBe(width);
          const edges = await inspectBlueprintRules(page, regions);
          expect(edges.length).toBeGreaterThan(0);
          for (const edge of edges) {
            expect(edge.owners, JSON.stringify(edge)).toHaveLength(1);
            expect(edge.owners[0]?.fullWidth).toBe(true);
          }
        });
      }
    });
  }
  test(`content accessibility in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await storeTheme(page, colorScheme);
    for (const path of [
      "/writing",
      "/projects",
      "/projects/tundra",
      "/404.html",
    ]) {
      await page.goto(path);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  });
}

test("project navigation resolves all detail pages and local links", async ({
  page,
  request,
}) => {
  await page.goto("/projects");
  const projectLinks = page.locator("main h2 a");
  await expect(projectLinks).toHaveCount(4);
  const hrefs = await projectLinks.evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")),
  );
  for (const href of hrefs) {
    if (!href) throw new Error("Project title must link to a detail page");
    await page.goto(href);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Projects" }),
    ).toHaveAttribute("aria-current", "location");
    const links = await page
      .locator('a[href^="/"]')
      .evaluateAll((elements) => [
        ...new Set(elements.map((element) => element.getAttribute("href"))),
      ]);
    for (const target of links) {
      if (!target) throw new Error("Missing local link destination");
      expect((await request.get(target)).status()).toBe(200);
    }
  }
});

test("draft writing is absent from production routes and the public index", async ({
  page,
  request,
}) => {
  await page.goto("/writing");
  await expect(
    page.getByRole("heading", { name: "Some tentative topics" }),
  ).toBeVisible();
  await expect(page.locator("[data-writing-list]")).toHaveCount(0);
  expect(
    (await request.get("/writing/communication-as-composition")).status(),
  ).toBe(404);
  expect((await request.get("/lab/content/article")).status()).toBe(404);
});

test("section links keep their target below the sticky header", async ({
  page,
}) => {
  await page.goto("/projects/dynamic-pages");
  const link = page
    .getByRole("navigation", { name: "On this page" })
    .getByRole("link", { name: "From authoring to the edge" });
  await link.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#from-authoring-to-the-edge$/);
  const target = await page
    .locator("#from-authoring-to-the-edge")
    .boundingBox();
  expect(target?.y).toBeGreaterThanOrEqual(52);
});
