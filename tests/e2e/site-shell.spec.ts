import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { inspectBlueprintRules } from "../support/blueprint-rules";

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`site shell in ${colorScheme}`, () => {
    test.use({ colorScheme });

    for (const width of [320, 768, 1024, 1440]) {
      test(`short and long pages share footer rails at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        for (const path of ["/writing", "/projects/dynamic-pages"]) {
          await page.goto(path);
          const footer = page.getByRole("contentinfo");
          await expect(footer).toHaveCount(1);
          await expect(
            footer.getByRole("heading", { name: "Simmer, strace & strum." }),
          ).toBeVisible();
          await expect(
            page.getByRole("main").getByRole("contentinfo"),
          ).toHaveCount(0);
          await expect(
            footer.getByRole("navigation", { name: "Social links" }),
          ).toBeVisible();
          await expect(
            footer.getByRole("link", { name: "GitHub" }),
          ).toHaveAttribute("href", "https://github.com/zlxlty");
          await expect(
            footer.getByRole("link", { name: "LinkedIn" }),
          ).toHaveAttribute("href", "https://linkedin.com/in/tianyi-lu-sky");
          await expect(
            footer.getByRole("link", { name: "chanhdai.com" }),
          ).toHaveAttribute("href", "https://chanhdai.com/");

          const frame = await page
            .locator('[data-slot="blueprint-rail"]')
            .boundingBox();
          const bounds = await footer.boundingBox();
          expect(frame).not.toBeNull();
          expect(bounds).not.toBeNull();
          if (!frame || !bounds)
            throw new Error("Missing footer or frame geometry");
          expect(bounds.x).toBeCloseTo(frame.x + 1, 3);
          expect(bounds.width).toBeCloseTo(frame.width - 2, 3);
          const backToTop = await footer
            .getByRole("link", { name: "Back to top" })
            .boundingBox();
          if (!backToTop) throw new Error("Missing back-to-top link");
          const privacy = await footer
            .getByRole("link", { name: "Privacy", exact: true })
            .boundingBox();
          const build = await footer
            .locator("[data-footer-meta] > p")
            .boundingBox();
          if (!privacy || !build) throw new Error("Missing footer metadata");
          expect(backToTop.y + backToTop.height / 2).toBeCloseTo(
            privacy.y + privacy.height / 2,
            1,
          );
          // When the build text shares the row, its center follows both links.
          if (Math.abs(build.y - privacy.y) < 40)
            expect(build.y + build.height / 2).toBeCloseTo(
              privacy.y + privacy.height / 2,
              1,
            );
          if (width >= 1024)
            expect(backToTop.x).toBeGreaterThan(frame.x + frame.width);
          else
            expect(backToTop.x + backToTop.width).toBeLessThanOrEqual(
              bounds.x + bounds.width,
            );
          expect(backToTop.x + backToTop.width).toBeLessThanOrEqual(width);
          expect(frame.y + frame.height).toBeGreaterThanOrEqual(
            bounds.y + bounds.height,
          );
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth),
          ).toBe(width);

          const header = page.getByRole("banner");
          const home = header.getByRole("link", { name: "Sky Lu — Home" });
          await expect(home).toHaveAttribute("href", "/");
          const brand = await home.boundingBox();
          const navigation = await header.getByRole("navigation").boundingBox();
          if (!brand || !navigation)
            throw new Error("Missing header brand or navigation geometry");
          expect(brand.x + brand.width).toBeLessThan(navigation.x);
          expect(brand.height).toBeGreaterThanOrEqual(40);
          const wordmark = await home.locator(":scope > span").boundingBox();
          const heading = await page
            .getByRole("main")
            .getByRole("heading", { level: 1 })
            .boundingBox();
          if (!wordmark || !heading)
            throw new Error("Missing wordmark or page heading geometry");
          expect(wordmark.x).toBeCloseTo(heading.x, 3);

          const edges = await inspectBlueprintRules(
            page,
            '[data-slot="blueprint-page"], [data-slot="site-footer"]',
          );
          expect(
            edges.every(
              ({ owners }) => owners.length === 1 && owners[0]?.fullWidth,
            ),
          ).toBe(true);
        }
      });
    }
  });
}

test.describe("site shell without JavaScript", () => {
  test.use({
    javaScriptEnabled: false,
    colorScheme: "dark",
    contextOptions: { reducedMotion: "reduce" },
  });

  for (const width of [320, 1440]) {
    test(`footer links and keyboard return to top work at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto("/projects/dynamic-pages");
      const footer = page.getByRole("contentinfo");
      await expect(footer.locator("[data-theme-toggle]")).toHaveCount(0);
      await expect(
        footer.getByText("海路 Seaway (Covered by me)", { exact: true }),
      ).toBeVisible();
      const link = footer.getByRole("link", { name: "Back to top" });
      await link.focus();
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      await link.press("Enter");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      expect(new URL(page.url()).hash).toBe("#top");
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("link", { name: "Skip to content" }),
      ).toBeFocused();
      await expect(page.locator("astro-island")).toHaveCount(0);
      const privacy = footer.getByRole("link", {
        name: "Privacy",
        exact: true,
      });
      await privacy.focus();
      await privacy.press("Enter");
      await expect(page).toHaveURL(/\/privacy$/);
      await expect(
        page.getByRole("heading", { name: "Privacy", exact: true }),
      ).toBeVisible();
    });
  }
});

test("the record fetches no audio until a listening gesture", async ({
  page,
}) => {
  const mediaRequests: string[] = [];
  page.on("request", (request) => {
    if (/spotify|scdn|skylu\.me/.test(new URL(request.url()).hostname)) {
      mediaRequests.push(request.url());
    }
  });
  await page.goto("/writing#site-footer");
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator('a[href*="spotify"]')).toHaveCount(0);
  await expect(footer.locator("iframe, [data-record-status]")).toHaveCount(0);
  await expect(footer.locator("audio")).toBeHidden();
  await expect(footer.locator("audio")).not.toHaveAttribute("src");
  await footer.getByRole("link", { name: "Privacy", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Music & external links" }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(mediaRequests).toEqual([]);
});

test("the sole header theme control updates with one announcement", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/writing");
  const header = page.getByRole("banner").getByRole("button");
  await expect(page.locator("[data-theme-toggle]")).toHaveCount(1);
  const announcement = page.locator("[data-theme-status]");
  await expect(announcement).toHaveCount(1);

  await header.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(header).toHaveAccessibleName("Switch to light theme");
  await expect(header).toBeFocused();
  await expect(announcement).toHaveText("Dark theme active.");

  await header.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(header).toHaveAccessibleName("Switch to dark theme");
  await expect(announcement).toHaveText("Light theme active.");
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe(
    "light",
  );
});
