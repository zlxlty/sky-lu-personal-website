import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { friends } from "../../src/data/people";
import { storeTheme } from "../support/theme";

declare global {
  interface Window {
    sameDocument?: boolean;
    fades?: string[];
    themeAtSwap?: string;
  }
}

const navLink = (page: Page, name: string) =>
  page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name, exact: true });
const homeLink = (page: Page) =>
  page.getByRole("banner").getByRole("link", { name: "Sky Lu — Home" });

async function markDocument(page: Page) {
  await page.evaluate(() => {
    window.sameDocument = true;
  });
}
const isSameDocument = (page: Page) =>
  page.evaluate(() => window.sameDocument === true);

async function recordFades(page: Page) {
  await page.addInitScript(() => {
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = (update) => {
      const transition = start(update);
      void transition.ready.then(() => {
        window.fades = document.getAnimations().flatMap(({ effect }) => {
          const pseudo =
            effect instanceof KeyframeEffect ? effect.pseudoElement : null;
          return pseudo ? [pseudo] : [];
        });
      });
      return transition;
    };
  });
}

test("same-site links fade to the next page in the same document", async ({
  page,
}) => {
  await recordFades(page);
  await page.goto("/");
  await markDocument(page);
  await navLink(page, "Writings").click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(page.getByRole("main")).toContainText("Writing");
  expect(await isSameDocument(page)).toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.fades ?? []))
    .toContain("::view-transition-old(root)");
});

test("reduced motion changes pages without the fade", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await recordFades(page);
  await page.goto("/");
  await navLink(page, "Writings").click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect.poll(() => page.evaluate(() => window.fades)).toBeDefined();
  expect(await page.evaluate(() => window.fades)).toEqual([]);
});

test("hovering a link prefetches the next page", async ({ page }) => {
  await page.goto("/");
  const prefetch = page.waitForRequest(/\/writing$/);
  await navLink(page, "Writings").hover();
  await prefetch;
});

test("links still load the next page with JavaScript off", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await navLink(page, "Writings").click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(page.getByRole("main")).toContainText("Writing");
  await context.close();
});

test("a swap resets scroll and focus and announces the new page", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => window.scrollTo(0, 400));
  await navLink(page, "Writings").click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator(".astro-route-announcer")).toHaveText(
    await page.title(),
  );
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("the chosen theme survives a swap and its toggle keeps working", async ({
  page,
}) => {
  await storeTheme(page, "light");
  await page.addInitScript(() => {
    document.addEventListener("astro:after-swap", () => {
      window.themeAtSwap = document.documentElement.dataset.theme;
    });
  });
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-theme", "light");
  await navLink(page, "Writings").click();
  await expect(page).toHaveURL(/\/writing$/);
  // Checked at swap time, so a dark frame between the two pages would fail.
  await expect
    .poll(() => page.evaluate(() => window.themeAtSwap))
    .toBe("light");
  await expect(html).toHaveAttribute("data-theme", "light");
  await expect(html).toHaveCSS("color-scheme", "light");
  const meta = page.locator('meta[name="theme-color"]');
  const light = await meta.getAttribute("data-theme-light");
  await expect(meta).toHaveAttribute("content", light ?? "");
  const toggle = page.getByRole("banner").locator("[data-theme-toggle]");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("title", "Switch to dark theme");
  await toggle.click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(page.locator("[data-theme-status]")).toHaveText(
    "Dark theme active.",
  );
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");
});

test("the homepage header fades with scroll after arriving by link", async ({
  page,
}) => {
  await page.goto("/writing");
  await homeLink(page).click();
  await expect(page).toHaveURL(/\/$/);
  const background = page.locator('[data-slot="site-header-background"]');
  await expect
    .poll(() =>
      background.evaluate((element) => element.getAnimations().length),
    )
    .toBe(1);
  await page.evaluate(() => window.scrollTo(0, 48));
  await expect
    .poll(() =>
      background.evaluate((element) =>
        Number(getComputedStyle(element).opacity),
      ),
    )
    .toBeCloseTo(0.5, 2);
});

test("text hints work again after returning to the homepage", async ({
  page,
}) => {
  await page.goto("/");
  await navLink(page, "Writings").click();
  await expect(page).toHaveURL(/\/writing$/);
  await homeLink(page).click();
  await expect(page).toHaveURL(/\/$/);
  const hint = page.locator("[data-text-hint]").first();
  const trigger = hint.locator("[data-text-hint-trigger]");
  await expect(trigger).not.toHaveAttribute("title");
  await trigger.hover();
  await expect(hint.getByRole("tooltip")).toBeVisible();
});

test("each visit to People by link shuffles the rows", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/");
  const names = page.locator("[data-person] h3");
  const original = friends.map((friend) => friend.name);
  const shuffled = [...original.slice(1), original[0]];
  const note = page.locator('[data-people-order="inline"]');
  for (let visit = 0; visit < 2; visit++) {
    await navLink(page, "People").click();
    await expect(page).toHaveURL(/\/people$/);
    await expect(names).toHaveText(shuffled);
    await expect(note).not.toHaveAttribute("hidden");
    await navLink(page, "Writings").click();
    await expect(page).toHaveURL(/\/writing$/);
  }
});
