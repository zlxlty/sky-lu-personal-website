import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const guitar = (page: Page) => page.locator("[data-guitar]");
async function open(page: Page) {
  await page.goto("/");
  await expect(guitar(page)).toHaveAttribute("data-ready");
}
async function crossing(page: Page) {
  return guitar(page).evaluate((element) => {
    if (!(element instanceof SVGSVGElement)) throw new Error("Expected SVG");
    const matrix = element.getScreenCTM();
    const paths = element.querySelectorAll<SVGPathElement>("[data-string-ink]");
    const first = paths[0];
    const last = paths[5];
    if (!matrix || !first || !last) throw new Error("Missing strings");
    const a = first.getPointAtLength(first.getTotalLength() / 2);
    const b = last.getPointAtLength(last.getTotalLength() / 2);
    const dx = (b.x - a.x) / 5;
    const dy = (b.y - a.y) / 5;
    const start = new DOMPoint(a.x - dx, a.y - dy).matrixTransform(matrix);
    const end = new DOMPoint(b.x + dx, b.y + dy).matrixTransform(matrix);
    return { start: { x: start.x, y: start.y }, end: { x: end.x, y: end.y } };
  });
}

async function stringPoint(page: Page, index: number) {
  return guitar(page).evaluate((element, stringIndex) => {
    if (!(element instanceof SVGSVGElement)) throw new Error("Expected SVG");
    const matrix = element.getScreenCTM();
    const path =
      element.querySelectorAll<SVGPathElement>("[data-string-ink]")[
        stringIndex
      ];
    if (!matrix || !path) throw new Error("Missing string");
    const point = path
      .getPointAtLength(path.getTotalLength() / 2)
      .matrixTransform(matrix);
    return { x: point.x, y: point.y };
  }, index);
}

async function watchPlucks(page: Page) {
  return guitar(page).evaluateHandle((element) => {
    const hits: number[] = [];
    const observer = new MutationObserver((changes) => {
      for (const { target } of changes) {
        if (target instanceof Element && target.hasAttribute("data-vibrating"))
          hits.push(Number(target.getAttribute("data-guitar-string")));
      }
    });
    observer.observe(element, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-vibrating"],
    });
    return { hits, disconnect: () => observer.disconnect() };
  });
}

test("clicking each string plucks it once; empty and secondary clicks do nothing", async ({
  page,
}) => {
  await open(page);
  const plucks = await watchPlucks(page);
  for (let index = 0; index < 6; index++) {
    const point = await stringPoint(page, index);
    await page.mouse.click(point.x, point.y);
    const active = guitar(page).locator("[data-vibrating]");
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute("data-guitar-string", String(index));
    await expect(guitar(page)).not.toHaveAttribute("data-armed");
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
    expect(await plucks.evaluate(({ hits }) => hits)).toEqual(
      Array.from({ length: index + 1 }, (_, i) => i),
    );
  }
  const string = await stringPoint(page, 0);
  await page.mouse.click(string.x, string.y, { button: "right" });
  const { start } = await crossing(page);
  await page.mouse.click(start.x, start.y);
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  expect(await plucks.evaluate(({ hits }) => hits)).toEqual([0, 1, 2, 3, 4, 5]);
  await plucks.evaluate((watcher) => watcher.disconnect());
  await plucks.dispose();
});

test("a press on a string continues into a strum without a release pluck", async ({
  page,
}) => {
  await open(page);
  const plucks = await watchPlucks(page);
  const first = await stringPoint(page, 0);
  const last = await stringPoint(page, 5);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  // Cross the last centerline, but release within its hit area. Stopping
  // exactly on the line is ambiguous after browser coordinate rounding.
  await page.mouse.move(
    last.x + (last.x - first.x) * 0.02,
    last.y + (last.y - first.y) * 0.02,
  );
  await page.mouse.up();
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  expect(await plucks.evaluate(({ hits }) => hits)).toEqual([0, 1, 2, 3, 4, 5]);
  await plucks.evaluate((watcher) => watcher.disconnect());
  await plucks.dispose();
});

test("only a held pointer strums; strings settle and disarm", async ({
  page,
}) => {
  await open(page);
  const paths = guitar(page).locator("[data-string-ink]");
  const resting = await paths.first().getAttribute("d");
  const { start, end } = await crossing(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.move(end.x, end.y);
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await expect(guitar(page)).toHaveAttribute("data-armed");
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  await page.mouse.move(end.x, end.y);
  await expect(guitar(page).locator("[data-vibrating]")).toHaveCount(6);
  await expect(paths.first()).not.toHaveAttribute("d", resting ?? "");
  await page.mouse.up();
  await expect(guitar(page)).not.toHaveAttribute("data-armed");
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  await expect(paths.first()).toHaveAttribute("d", resting ?? "");
});

test("leaving the instrument and blurring the window release a held gesture", async ({
  page,
}) => {
  await open(page);
  for (const reason of ["outside", "blur"]) {
    const { start, end } = await crossing(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y);
    await expect(guitar(page)).toHaveAttribute("data-armed");
    if (reason === "outside") await page.mouse.move(1, 1);
    else await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect(guitar(page)).not.toHaveAttribute("data-armed");
    await page.mouse.up();
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
  }
});

test("keyboard plucks honor reduced motion and have accessible controls", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await open(page);
  const bass = guitar(page).getByRole("button", {
    name: "Pluck string 6, low E",
  });
  const path = bass.locator("[data-string-ink]");
  const resting = await path.getAttribute("d");
  await bass.focus();
  await bass.press("Enter");
  await expect(bass).toHaveAttribute("data-vibrating");
  await expect(path).toHaveAttribute("d", resting ?? "");
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  const result = await new AxeBuilder({ page })
    .exclude("astro-dev-toolbar")
    .analyze();
  expect(result.violations).toEqual([]);
});

for (const width of [360, 767, 768, 1440]) {
  test(`selected layout keeps strings clear of copy at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    const copy = await page.locator("[data-hero-copy]").boundingBox();
    const instrument = await page
      .locator("[data-guitar-viewport]")
      .boundingBox();
    if (!copy || !instrument) throw new Error("Missing hero content");
    if (width < 768) {
      expect(instrument.y).toBeGreaterThan(copy.y + copy.height);
    } else {
      const panel = await page.locator("#hero-panel").boundingBox();
      if (!panel) throw new Error("Missing hero panel");
      expect(instrument.x).toBeCloseTo(panel.x, 0);
      expect(instrument.width).toBeCloseTo(panel.width, 0);
      const geometry = await guitar(page).evaluate((svg, text) => {
        if (!(svg instanceof SVGSVGElement)) throw new Error("Expected SVG");
        const matrix = svg.getScreenCTM();
        if (!matrix) throw new Error("Missing SVG transform");
        const paths = Array.from(
          svg.querySelectorAll<SVGPathElement>("[data-string-ink]"),
        );
        return paths.map((path) => {
          const start = path.getPointAtLength(0).matrixTransform(matrix);
          const intersectsCopy = Array.from({ length: 101 }, (_, index) =>
            path
              .getPointAtLength((path.getTotalLength() * index) / 100)
              .matrixTransform(matrix),
          ).some(
            (point) =>
              point.x >= text.x - 8 &&
              point.x <= text.x + text.width + 8 &&
              point.y >= text.y - 8 &&
              point.y <= text.y + text.height + 8,
          );
          return { startY: start.y, intersectsCopy };
        });
      }, copy);
      for (const string of geometry) {
        expect(string.startY).toBeLessThan(instrument.y);
        expect(string.intersectsCopy).toBe(false);
      }
    }
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });
}

test("homepage hydrates only the guitar and has no design chooser", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  const island = page.locator("astro-island");
  await expect(island).toHaveCount(1);
  await expect(island).toHaveAttribute("component-url", /GuitarStrings/);
  await expect(island.locator("[data-hero-copy]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /guitar design/ })).toHaveCount(
    0,
  );
  await expect(guitar(page)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test.describe("touch", () => {
  test.use({ hasTouch: true, viewport: { width: 360, height: 900 } });
  test("a tap plucks only the selected string", async ({ page }) => {
    await open(page);
    await guitar(page).scrollIntoViewIfNeeded();
    for (const index of [0, 5]) {
      const point = await stringPoint(page, index);
      await page.touchscreen.tap(point.x, point.y);
      const active = guitar(page).locator("[data-vibrating]");
      await expect(active).toHaveCount(1);
      await expect(active).toHaveAttribute("data-guitar-string", String(index));
      await expect(guitar(page)).not.toHaveAttribute("data-armed");
      await expect(guitar(page)).not.toHaveAttribute("data-animating");
    }
  });
  test("one-finger strums stay inside the instrument without scrolling", async ({
    page,
    context,
  }) => {
    await open(page);
    await guitar(page).scrollIntoViewIfNeeded();
    const { start, end } = await crossing(page);
    const scroll = await page.evaluate(() => scrollY);
    const session = await context.newCDPSession(page);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [start],
    });
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [end],
    });
    await expect(guitar(page).locator("[data-vibrating]")).toHaveCount(6);
    await session.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
    await expect(guitar(page)).not.toHaveAttribute("data-armed");
    expect(await page.evaluate(() => scrollY)).toBe(scroll);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(360);
  });
});
