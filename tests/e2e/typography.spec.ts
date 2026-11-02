import { expect, test } from "@playwright/test";

const paragraphs = [
  {
    label: "hero intro",
    path: "/",
    selector: "[data-hero-copy] > p:last-child",
  },
  { label: "overview", path: "/", selector: "#overview-people-heading + p" },
  { label: "timeline", path: "/", selector: "[data-timeline-viewport] li p" },
  { label: "writing idea", path: "/", selector: "[id^='writing-idea-'] + p" },
  { label: "project card", path: "/", selector: "[id^='home-project-'] + p" },
  { label: "People note", path: "/people", selector: "[data-person] p" },
  { label: "reader", path: "/projects/tundra", selector: ".content-prose p" },
];

for (const width of [390, 1280]) {
  test.describe(`at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
    });

    for (const { label, path, selector } of paragraphs) {
      test(`${label} text is 16px on a 26px line`, async ({ page }) => {
        await page.goto(path);
        const paragraph = page.locator(selector).first();
        await expect(paragraph).toHaveCSS("font-size", "16px");
        await expect(paragraph).toHaveCSS("line-height", "26px");
      });
    }

    test("header navigation fits its breakpoint", async ({ page }) => {
      await page.goto("/");
      const link = page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link")
        .first();
      await expect(link).toHaveCSS("font-size", width < 640 ? "14px" : "16px");
    });

    test("standalone links are 16px", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("link", { name: "All projects" })).toHaveCSS(
        "font-size",
        "16px",
      );
      await expect(
        page
          .getByRole("navigation", { name: "Social links" })
          .getByRole("link")
          .first(),
      ).toHaveCSS("font-size", "16px");
    });

    test("overview labels share the body line height", async ({ page }) => {
      await page.goto("/");
      const label = page.locator("#overview-people-heading");
      await expect(label).toHaveCSS("font-size", "12px");
      await expect(label).toHaveCSS("line-height", "26px");
    });

    test("People names stand clear of their notes", async ({ page }) => {
      await page.goto("/people");
      const name = page.locator("[data-person] h3").first();
      await expect(name).toHaveCSS("font-size", "20px");
      await expect(name).toHaveCSS("line-height", "28px");
    });
  });
}

for (const width of [320, 640, 1280]) {
  test(`the honesty note reads cleanly on two lines at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const note = page.locator("p", {
      hasText: "I try to keep the professional",
    });
    await expect(note).toHaveText(
      "I try to keep the professional façade to a minimum here",
    );
    const box = await note.boundingBox();
    if (!box) throw new Error("Missing honesty note");
    expect(box.height).toBe(2 * 26);
  });
}

const publicPaths = [
  "/",
  "/writing",
  "/projects",
  "/people",
  "/projects/tundra",
  "/privacy",
];

for (const path of publicPaths) {
  for (const width of [390, 1280]) {
    test(`no visible text on ${path} falls below the floors at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const tooSmall = await page.evaluate(() => {
        const found: string[] = [];
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
        );
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent?.trim();
          const element = node.parentElement;
          if (!text || !element) continue;
          if (element.closest(".sr-only, script, style, noscript")) continue;
          if (!element.checkVisibility({ visibilityProperty: true })) continue;
          const style = getComputedStyle(element);
          const size = Number.parseFloat(style.fontSize);
          const floor = style.fontFamily.includes("Mono") ? 12 : 14;
          if (size < floor) found.push(`${size}px: ${text.slice(0, 40)}`);
        }
        return found;
      });
      expect(tooSmall).toEqual([]);
    });
  }
}
