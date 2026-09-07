import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { education } from "../../src/data/profile";
import { research } from "../../src/data/research";
import { inspectBlueprintRules } from "../support/blueprint-rules";

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 768, 1440]) {
    test.describe(`homepage content at ${width}px in ${colorScheme}`, () => {
      test.use({
        javaScriptEnabled: false,
        colorScheme,
        viewport: { width, height: 900 },
      });

      test("content and nested project borders work without hydration", async ({
        page,
      }) => {
        await page.goto("/");
        await page.evaluate(() => document.fonts.ready);
        const overview = page.getByRole("region", { name: "Explore more" });
        for (const entry of education) {
          await expect(
            overview.getByText(entry.institution, { exact: true }),
          ).toBeVisible();
          await expect(
            overview.locator(`time[datetime="${entry.graduation.date}"]`),
          ).toHaveCount(1);
        }
        await expect(
          page
            .locator("#research")
            .getByRole("link", { name: research.group.label }),
        ).toHaveAttribute("href", research.group.href);
        await expect(
          page
            .locator("#research")
            .getByRole("link", { name: research.collaborator.label }),
        ).toHaveAttribute("href", research.collaborator.href);
        await expect(page.locator("#selected-work h3 a")).toHaveCount(4);
        await expect(
          page.locator(
            "#after-guitar astro-island, #research astro-island, #selected-work astro-island",
          ),
        ).toHaveCount(0);
        await expect(
          page.locator('a[href="/writing/communication-as-composition"]'),
        ).toHaveCount(0);
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
        const edges = await inspectBlueprintRules(
          page,
          '#after-guitar, #research, #selected-work, #selected-work [data-slot="panel"], #selected-work [data-slot="panel-header"]',
        );
        for (const edge of edges) {
          expect(edge.owners, JSON.stringify(edge)).toHaveLength(1);
          expect(edge.owners[0]?.fullWidth).toBe(true);
        }
      });
    });
  }
  // Axe runs page scripts; keep this separate from the no-JavaScript contract.
  test(`homepage content is accessible in ${colorScheme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.goto("/");
    const accessibility = await new AxeBuilder({ page })
      .include("#after-guitar")
      .include("#research")
      .include("#selected-work")
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("homepage project previews agree with the index and link to real detail pages", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const titles = await page.locator("#selected-work h3 a").allTextContents();
  const links = await page
    .locator("#selected-work h3 a")
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("href")),
    );
  for (const href of links) {
    if (!href) throw new Error("Missing project destination");
    expect((await request.get(href)).status()).toBe(200);
  }
  await page
    .getByRole("link", { name: "Selected projects", exact: true })
    .click();
  await expect(page).toHaveURL(/#selected-work$/);
  const top = await page
    .locator("#selected-work")
    .evaluate((element) => element.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(52);
  await page.goto("/projects");
  const indexTitles = await page.locator("main h2 a").allTextContents();
  const normalize = (values: string[]) =>
    values.map((value) => value.replace(/\s+/g, " ").trim());
  expect(normalize(titles)).toEqual(normalize(indexTitles));
});
