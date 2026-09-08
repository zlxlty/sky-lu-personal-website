import { expect, test, type Locator } from "@playwright/test";
import { storeTheme } from "../support/theme";

async function strokeProgress(mark: Locator, progress: number) {
  return mark
    .locator("path")
    .first()
    .evaluate((path, fraction) => {
      const transition = path
        .getAnimations()
        .find(
          (animation) =>
            animation instanceof CSSTransition &&
            animation.transitionProperty === "stroke-dashoffset",
        );
      if (!transition?.effect) throw new Error("Missing stroke transition");
      transition.pause();
      transition.currentTime =
        Number(transition.effect.getTiming().duration) * fraction;
      return Number.parseFloat(getComputedStyle(path).strokeDashoffset);
    }, progress);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`project hover uses a cached pen gesture in ${colorScheme}`, async ({
    page,
  }, testInfo) => {
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await storeTheme(page, colorScheme);
    await page.goto("/projects");
    await page.evaluate(() => document.fonts.ready);
    const link = page.getByRole("link", { name: "Dynamic Pages", exact: true });
    const mark = link.locator("sketch-underline");
    const svg = mark.locator("svg");
    await expect(mark).toHaveAttribute("data-ready", "");
    await expect(svg).toHaveCSS("visibility", "hidden");
    const before = await link.boundingBox();
    const path = await mark.locator("path").elementHandle();
    if (!path) throw new Error("Missing underline path");
    await link.hover();
    await expect(svg).toHaveCSS("visibility", "visible");
    await expect(svg).toHaveCSS("opacity", "0.72");
    await expect(svg).toHaveCSS(
      "stroke",
      await link.evaluate((element) => getComputedStyle(element).color),
    );
    await expect(link).toHaveCSS("text-decoration-line", "none");
    await expect(mark.locator("path")).toHaveCSS("transition-duration", "0s");
    await expect(mark.locator("path")).toHaveCSS("stroke-dashoffset", "0px");
    expect(await link.boundingBox()).toEqual(before);
    await testInfo.attach("project-hover", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.getByRole("heading", { name: "Projects", exact: true }).hover();
    await link.focus();
    await expect(svg).toHaveCSS("visibility", "hidden");
    await expect(mark.locator("path")).toHaveCSS("stroke-dashoffset", "1px");
    await expect(link).toHaveCSS("outline-style", "solid");
    await expect(link).toBeFocused();
    expect(await path.evaluate((node) => node.isConnected)).toBe(true);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/projects\/dynamic-pages$/);
  });
}

test("drawing and backward erasing reverse smoothly when interrupted", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/projects");
  const link = page.getByRole("link", { name: "Dynamic Pages", exact: true });
  const mark = link.locator("sketch-underline");
  const svg = mark.locator("svg");
  const path = mark.locator("path");
  const away = page.getByRole("heading", { name: "Projects", exact: true });
  await expect(mark).toHaveAttribute("data-ready", "");
  await expect(path).toHaveCSS("transition-duration", "0.14s");
  await link.hover();
  await expect(path).toHaveCSS("transition-duration", "0.187s");
  await away.hover();
  await expect(svg).toHaveCSS("visibility", "hidden");
  const original = await path.getAttribute("d");
  // Slow this test's transition so CI can seek exact intermediate frames.
  await mark.evaluate((element) => {
    element.style.setProperty("--duration-sketch-in", "10s");
    element.style.setProperty("--duration-sketch-out", "10s");
  });
  await link.hover();
  const drawing = await strokeProgress(mark, 0.4);
  expect(drawing).toBeCloseTo(0.6, 2);
  await expect(svg).toHaveCSS("opacity", "0.72");
  await expect(svg).toHaveCSS("visibility", "visible");

  await away.hover();
  expect(await strokeProgress(mark, 0)).toBeCloseTo(drawing, 2);
  const erasing = await strokeProgress(mark, 0.5);
  expect(erasing).toBeGreaterThan(drawing);
  expect(erasing).toBeLessThan(1);
  await expect(svg).toHaveCSS("opacity", "0.72");
  await expect(svg).toHaveCSS("visibility", "visible");

  await link.hover();
  expect(await strokeProgress(mark, 0)).toBeCloseTo(erasing, 2);
  expect(await strokeProgress(mark, 1)).toBe(0);
  await mark.evaluate((element) => {
    element.style.removeProperty("--duration-sketch-in");
    element.style.removeProperty("--duration-sketch-out");
  });
  await away.hover();
  await expect(path).toHaveCSS("stroke-dashoffset", "1px");
  await expect(svg).toHaveCSS("visibility", "hidden");
  await expect(path).toHaveAttribute("d", original ?? "");
  await link.hover();
  await expect(path).toHaveCSS("stroke-dashoffset", "0px");
  await expect(svg).toHaveCSS("visibility", "visible");
});

test("all public page sketches are hidden at rest, including current navigation", async ({
  page,
}) => {
  for (const route of [
    "/",
    "/projects",
    "/projects/dynamic-pages",
    "/writing",
    "/missing-page",
  ]) {
    await page.goto(route);
    // Hidden responsive links have no measurable width until they become visible.
    for (const sketch of await page.locator("sketch-underline").all()) {
      if (await sketch.isVisible())
        await expect(sketch).toHaveAttribute("data-ready");
    }
    for (const svg of await page.locator("sketch-underline svg").all()) {
      await expect(svg).toHaveCSS("visibility", "hidden");
    }
  }
});

test("touch navigation does not leave a sticky sketch", async ({ browser }) => {
  const context = await browser.newContext({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto("/projects/dynamic-pages");
  const link = page.getByRole("link", {
    name: "The publishing pipeline",
    exact: true,
  });
  await link.tap();
  await expect(page).toHaveURL(/#the-publishing-pipeline$/);
  await expect(link.locator("svg")).toHaveCSS("visibility", "hidden");
  await context.close();
});

test.describe("native decoration fallbacks", () => {
  test("links remain underlined and navigable without JavaScript", async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/projects");
    const link = page.getByRole("link", { name: "Dynamic Pages", exact: true });
    await link.hover();
    await expect(link.locator("sketch-underline")).toHaveCSS(
      "text-decoration-line",
      "underline",
    );
    await link.click();
    await expect(page.locator("h1")).toHaveText("Dynamic Pages");
    await context.close();
  });
  test("forced colors use the native underline and keyboard outline", async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await page.goto("/projects");
    const link = page.getByRole("link", { name: "Dynamic Pages", exact: true });
    await link.focus();
    await expect(link.locator("sketch-underline")).toHaveCSS(
      "text-decoration-line",
      "underline",
    );
    await expect(link.locator("svg")).toHaveCSS("visibility", "hidden");
    await expect(link).toHaveCSS("outline-style", "solid");
  });
});
