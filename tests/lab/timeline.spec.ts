import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("independent timelines scroll only when their content overflows", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/lab/timeline");
  const full = page.locator("#timeline-full");
  const short = page.locator("#timeline-short");
  const single = page.locator("#timeline-single");
  await short.hover();
  await page.mouse.wheel(0, 150);
  expect(await short.evaluate((el) => el.scrollLeft)).toBe(0);
  await full.hover();
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => page.locator("#timeline-full").evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(100);
  expect(
    await page.locator("#timeline-short").evaluate((el) => el.scrollLeft),
  ).toBe(0);
  await page.setViewportSize({ width: 320, height: 900 });
  await short.hover();
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => short.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(100);
  expect(await single.evaluate((el) => el.scrollWidth - el.clientWidth)).toBe(
    0,
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(
    await page.locator("#timeline-short").evaluate((el) => el.scrollLeft),
  ).toBe(0);
});

test("timeline headings, scroll regions, and links are accessible", async ({
  page,
}) => {
  await page.goto("/lab/timeline");
  expect(
    (await new AxeBuilder({ page }).include("horizontal-timeline").analyze())
      .violations,
  ).toEqual([]);
});
