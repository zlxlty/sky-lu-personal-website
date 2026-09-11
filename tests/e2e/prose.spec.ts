import { expect, test } from "@playwright/test";
import { showStaticTheme } from "../support/theme";

test.use({ javaScriptEnabled: false });

for (const theme of ["light", "dark"] as const) {
  for (const width of [390, 1440]) {
    test(`project Markdown preserves heading hierarchy and spacing in ${theme} at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto("/projects/tundra");
      await showStaticTheme(page, theme);
      const prose = page.locator(".content-prose");
      const paragraphs = prose.locator("p");
      const headings = prose.getByRole("heading", { level: 2 });
      await expect(headings).toHaveCount(3);
      await expect(headings.first()).toHaveCSS("font-size", "30px");
      await expect(headings.first()).toHaveCSS("font-weight", "500");
      await expect(headings.first()).toHaveCSS("margin-top", "0px");
      await expect(headings.nth(1)).toHaveCSS("margin-top", "40px");
      await expect(headings.nth(1)).toHaveCSS("margin-bottom", "16px");
      await expect(paragraphs.first()).toHaveCSS("font-size", "16px");
      await expect(paragraphs.first()).toHaveCSS("margin-bottom", "24px");
      await expect(paragraphs.last()).toHaveCSS("margin-bottom", "0px");
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
    });
  }
}

test("project Markdown lists retain their bullets and indentation", async ({
  page,
}) => {
  await page.goto("/projects/kvonset");
  const list = page.locator(".content-prose ul");
  await expect(list).toHaveCSS("list-style-type", "disc");
  await expect(list).toHaveCSS("padding-left", "24px");
  await expect(list).toHaveCSS("margin-top", "24px");
  await expect(list.locator("li").first()).toHaveCSS("margin-top", "8px");
});
