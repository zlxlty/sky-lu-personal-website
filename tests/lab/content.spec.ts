import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { inspectBlueprintRules } from "../support/blueprint-rules";
import { showStaticTheme, storeTheme } from "../support/theme";

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 768, 1440]) {
    test.describe(`${colorScheme} content specimens at ${width}px`, () => {
      test.use({
        javaScriptEnabled: false,
        colorScheme,
        contextOptions: { reducedMotion: "reduce" },
        viewport: { width, height: 900 },
      });
      test("populated index composes correctly", async ({ page }) => {
        await page.goto("/lab/content/writing");
        await showStaticTheme(page, colorScheme);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator("[data-content-row]")).toHaveCount(3);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
        const edges = await inspectBlueprintRules(
          page,
          '[data-slot="panel"], [data-slot="panel-header"], [data-slot="panel-body"], [data-slot="stripe-separator"], [data-slot="panel-rule-band"], [data-content-row]',
        );
        expect(edges.length).toBeGreaterThan(0);
        for (const edge of edges)
          expect(edge.owners, JSON.stringify(edge)).toHaveLength(1);
      });
      test("article prose and code remain within the rail", async ({
        page,
      }) => {
        await page.goto("/lab/content/article");
        await showStaticTheme(page, colorScheme);
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
          "content",
          "noindex,nofollow",
        );
        await expect(page.locator(".content-prose table")).toHaveCount(1);
        const pre = page.locator(".content-prose pre");
        await expect(pre).toHaveCount(1);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
        expect(
          await pre.evaluate((element) => getComputedStyle(element).overflowX),
        ).toBe("auto");
        expect(
          await pre.evaluate(
            (element) => element.scrollWidth > element.clientWidth,
          ),
        ).toBe(true);
      });
    });
  }
  test(`content specimen accessibility in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await storeTheme(page, colorScheme);
    for (const path of ["/lab/content/article", "/lab/content/writing"]) {
      await page.goto(path);
      expect(
        (
          await new AxeBuilder({ page })
            .exclude("astro-dev-toolbar")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    }
  });
}
