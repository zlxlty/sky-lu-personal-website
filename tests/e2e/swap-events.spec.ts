import { expect, test } from "@playwright/test";
import { storeTheme } from "../support/theme";

test("before a swap, the new page takes the current theme", async ({
  page,
}) => {
  await storeTheme(page, "light");
  await page.goto("/");
  const copied = await page.evaluate(() => {
    const newDocument = new DOMParser().parseFromString(
      '<html data-theme="dark"><head><meta name="theme-color" content="#000000"></head></html>',
      "text/html",
    );
    document.dispatchEvent(
      Object.assign(new Event("astro:before-swap"), { newDocument }),
    );
    return {
      theme: newDocument.documentElement.dataset.theme,
      colorScheme: newDocument.documentElement.style.colorScheme,
      color: newDocument
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
      current: document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    };
  });
  expect(copied.theme).toBe("light");
  expect(copied.colorScheme).toBe("light");
  expect(copied.color).toBe(copied.current);
});

test("after a swap, a new theme toggle is shown and works", async ({
  page,
}) => {
  await page.goto("/");
  const toggle = page.getByRole("banner").locator("[data-theme-toggle]");
  await expect(toggle).toBeVisible();
  await toggle.evaluate((node) => {
    if (!(node instanceof HTMLButtonElement))
      throw new Error("Expected button");
    const fresh = node.cloneNode(true);
    if (!(fresh instanceof HTMLButtonElement))
      throw new Error("Expected button");
    fresh.hidden = true;
    node.replaceWith(fresh);
    document.dispatchEvent(new Event("astro:after-swap"));
  });
  await expect(toggle).toBeVisible();
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("after a swap, the homepage header is enhanced exactly once", async ({
  page,
}) => {
  await page.goto("/");
  const background = page.locator('[data-slot="site-header-background"]');
  const animations = () =>
    background.evaluate((element) => element.getAnimations().length);
  await expect.poll(animations).toBe(1);
  await page.evaluate(() =>
    document.dispatchEvent(new Event("astro:after-swap")),
  );
  await expect.poll(animations).toBe(1);
  await page.evaluate(() => window.scrollTo(0, 48));
  await expect
    .poll(() =>
      background.evaluate((element) =>
        Number(getComputedStyle(element).opacity),
      ),
    )
    .toBeCloseTo(0.5, 2);
});

test("after a page load event, new text hints are wired", async ({ page }) => {
  await page.goto("/");
  await page
    .locator("[data-text-hint]")
    .first()
    .evaluate((node) => {
      const fresh = node.cloneNode(true);
      if (!(fresh instanceof HTMLElement)) throw new Error("Expected element");
      fresh
        .querySelector("[data-text-hint-trigger]")
        ?.setAttribute("title", "Native fallback");
      node.replaceWith(fresh);
      document.dispatchEvent(new Event("astro:page-load"));
    });
  const hint = page.locator("[data-text-hint]").first();
  const trigger = hint.locator("[data-text-hint-trigger]");
  await expect(trigger).not.toHaveAttribute("title");
  await trigger.hover();
  await expect(hint.getByRole("tooltip")).toBeVisible();
});
