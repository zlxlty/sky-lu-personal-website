import { expect, test, type Page } from "@playwright/test";
import { screenshotPixels } from "../support/blueprint-rules";

const background = (page: Page) =>
  page.locator('[data-slot="site-header-background"]');

async function open(page: Page) {
  await page.goto("/");
  await expect
    .poll(() =>
      background(page).evaluate((element) => element.getAnimations().length),
    )
    .toBe(1);
}

async function scroll(page: Page, y: number, opacity: number) {
  await page.evaluate((y) => window.scrollTo(0, y), y);
  await expect
    .poll(() =>
      background(page).evaluate((element) =>
        Number(getComputedStyle(element).opacity),
      ),
    )
    .toBeCloseTo(opacity, 2);
}

for (const colorScheme of ["light", "dark"] as const) {
  test(`homepage header fades with scroll and reverses in ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme });
    await open(page);
    for (const [y, opacity] of [
      [0, 0],
      [24, 0.125],
      [48, 0.5],
      [96, 1],
      [400, 1],
      [48, 0.5],
      [0, 0],
    ]) {
      await scroll(page, y, opacity);
    }
    expect(
      await background(page).evaluate((element) =>
        element
          .getAnimations()
          .every((animation) => animation.playState === "paused"),
      ),
    ).toBe(true);
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Writings", exact: true })
      .click();
    await expect(page).toHaveURL(/\/writing$/);
    await expect(background(page)).toHaveCSS("opacity", "1");
    expect(
      await background(page).evaluate(
        (element) => element.getAnimations().length,
      ),
    ).toBe(0);
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sky Lu — Home" }),
    ).toBeVisible();
  });
}

for (const width of [768, 1440]) {
  test(`the same six strings are visible behind the header at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await open(page);
    await scroll(page, 0, 0);
    const crossings = await page.locator("[data-guitar]").evaluate((svg) => {
      if (!(svg instanceof SVGSVGElement)) throw new Error("Missing guitar");
      const matrix = svg.getScreenCTM();
      const header = document
        .querySelector('[data-slot="site-header"]')
        ?.getBoundingClientRect();
      if (!matrix || !header) throw new Error("Missing header geometry");
      const y = header.top + header.height / 2;
      return [...svg.querySelectorAll<SVGPathElement>("[data-string-ink]")].map(
        (path) => {
          const from = path.getPointAtLength(0).matrixTransform(matrix);
          const to = path
            .getPointAtLength(path.getTotalLength())
            .matrixTransform(matrix);
          return {
            x: from.x + ((to.x - from.x) * (y - from.y)) / (to.y - from.y),
            y,
          };
        },
      );
    });
    expect(crossings).toHaveLength(6);
    // Sample a few neighboring pixels to account for subpixel SVG antialiasing.
    const pixels = await screenshotPixels(
      page,
      crossings.flatMap(({ x, y }) =>
        [-1, 0, 1].map((offset) => ({ x: x + offset, y })),
      ),
    );
    for (let index = 0; index < crossings.length; index++) {
      expect(
        pixels
          .slice(index * 3, index * 3 + 3)
          .some((pixel) => (pixel[0] ?? 0) > 48),
      ).toBe(true);
    }
    await expect(page.locator("[data-guitar]")).toHaveCount(1);
    await expect(page.locator("astro-island")).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("mobile keeps the guitar below the copy while the header still fades", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page);
  const copy = await page.locator("[data-hero-copy]").boundingBox();
  const viewport = await page.locator("[data-guitar-viewport]").boundingBox();
  if (!copy || !viewport) throw new Error("Missing mobile composition");
  expect(viewport.y).toBeGreaterThan(copy.y + copy.height);
  await expect(page.locator("[data-guitar-viewport]")).toHaveCSS(
    "overflow",
    "hidden",
  );
  await expect(page.locator("[data-guitar]")).toHaveCSS("clip-path", "none");
  await scroll(page, 48, 0.5);
});

test("reduced motion switches the mask immediately and responds to preference changes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  await scroll(page, 0, 0);
  await scroll(page, 1, 1);
  await scroll(page, 48, 1);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await scroll(page, 48, 0.5);
  await scroll(page, 0, 0);
});

test("page exit releases motion and a bfcache restore rebinds it once", async ({
  page,
}) => {
  await open(page);
  await scroll(page, 48, 0.5);
  for (let cycle = 0; cycle < 2; cycle++) {
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pagehide", { persisted: true }),
      ),
    );
    await expect
      .poll(() =>
        background(page).evaluate((element) => element.getAnimations().length),
      )
      .toBe(0);
    await expect(background(page)).toHaveCSS("opacity", "1");
    await page.evaluate(() =>
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", { persisted: true }),
      ),
    );
    await expect
      .poll(() =>
        background(page).evaluate((element) => element.getAnimations().length),
      )
      .toBe(1);
    await scroll(page, 48, 0.5);
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the static header keeps its readable paper background", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(background(page)).toHaveCSS("opacity", "1");
    await page.evaluate(() => window.scrollTo(0, 200));
    await expect(background(page)).toHaveCSS("opacity", "1");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Projects", exact: true })
      .click();
    await expect(page).toHaveURL(/\/projects$/);
  });
});
