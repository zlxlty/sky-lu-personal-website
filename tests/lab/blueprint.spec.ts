import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import {
  inspectBlueprintRules,
  screenshotPixels,
} from "../support/blueprint-rules";

test.describe("static blueprint compositions", () => {
  test.use({ javaScriptEnabled: false });
  for (const theme of ["light", "dark"] as const) {
    for (const width of [360, 768, 1024, 1440]) {
      for (const example of [
        "adjacent",
        "dividers",
        "nested",
        "overlays",
        "pairs",
        "descriptions",
        "surfaces",
      ]) {
        test(`${example}: one rule per boundary at ${width}px in ${theme}`, async ({
          page,
        }) => {
          await page.setViewportSize({ width, height: 900 });
          await page.emulateMedia({
            colorScheme: theme,
            reducedMotion: "reduce",
          });
          await page.goto(`/lab/blueprint/${example}`);
          await expect(page.locator("[data-region]").first()).toBeVisible();
          await page.evaluate(() => document.fonts.ready.then(() => undefined));
          const report = await inspectBlueprintRules(page, "[data-region]");

          expect(report.length).toBeGreaterThan(2);
          expect(
            report.filter(
              ({ owners }) => owners.length !== 1 || !owners[0]?.fullWidth,
            ),
          ).toEqual([]);
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        });
      }
    }
  }
});

test("horizontal blueprint dividers never add vertical borders", async ({
  page,
}) => {
  await page.goto("/lab/blueprint/dividers");
  const borders = await page
    .locator('[data-slot="stripe-separator"], [data-slot="panel-rule-band"]')
    .evaluateAll((elements) =>
      elements.map((element) => ({
        slot: element.getAttribute("data-slot"),
        left: getComputedStyle(element).borderLeftWidth,
        right: getComputedStyle(element).borderRightWidth,
      })),
    );
  expect(borders.length).toBeGreaterThan(1);
  expect(
    borders.filter(({ left, right }) => left !== "0px" || right !== "0px"),
  ).toEqual([]);
});

test("rules remain visible above opaque panel backgrounds", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/lab/blueprint/surfaces");
  const samples = await page
    .locator('[data-region="surface-content"], [data-region="paper-content"]')
    .evaluateAll((elements) =>
      elements.map((element) => {
        const bounds = element.getBoundingClientRect();
        const numbers = (color: string) =>
          color.match(/[\d.]+/g)?.map(Number) ?? [];
        const background = numbers(getComputedStyle(element).backgroundColor);
        const rule = numbers(
          getComputedStyle(element, "::before").backgroundColor,
        );
        const alpha = rule[3] ?? 1;
        return {
          x: bounds.left + 8,
          y: bounds.top,
          expected: background
            .slice(0, 3)
            .map((channel, index) =>
              Math.round(channel * (1 - alpha) + rule[index] * alpha),
            ),
        };
      }),
    );
  expect(samples).toHaveLength(2);
  const pixels = await screenshotPixels(page, samples);
  for (const [index, sample] of samples.entries()) {
    expect(sample.expected).toHaveLength(3);
    for (const [channel, expected] of sample.expected.entries()) {
      expect(Math.abs(pixels[index][channel] - expected)).toBeLessThanOrEqual(
        1,
      );
    }
  }
});

for (const theme of ["light", "dark"] as const) {
  test(`sticky header masks scrolling stripes across the viewport in ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 600 });
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/lab/blueprint/pairs");
    await page
      .locator('[data-slot="stripe-separator"]')
      .first()
      .evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        window.scrollTo(0, bounds.top + bounds.height / 2 - 26);
      });

    const pixels = await screenshotPixels(
      page,
      Array.from({ length: 10 }, (_, index) => ({ x: 8 + index, y: 26 })),
    );
    for (const channel of [0, 1, 2]) {
      const values = pixels.map((pixel) => pixel[channel]);
      expect(Math.max(...values) - Math.min(...values)).toBeLessThanOrEqual(2);
    }
  });

  test(`blueprint examples remain accessible in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/lab/blueprint/pairs");
    const accessibility = await new AxeBuilder({ page })
      .exclude("astro-dev-toolbar")
      .analyze();
    expect(accessibility.violations).toEqual([]);
  });
}

test("the outer page panel owns continuous full-height vertical rails", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/lab/blueprint/short");
  const rail = await page
    .locator('[data-slot="blueprint-rail"]')
    .evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element, "::after");
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        left: style.borderLeftWidth,
        right: style.borderRightWidth,
        pageHeight: document.documentElement.scrollHeight,
      };
    });
  expect(rail).toEqual({
    top: 0,
    bottom: 900,
    left: "1px",
    right: "1px",
    pageHeight: 900,
  });
});
