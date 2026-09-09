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

test("releasing each string plucks it once; pressing, jitter, and secondary clicks do nothing", async ({
  page,
}) => {
  await open(page);
  const plucks = await watchPlucks(page);
  for (let index = 0; index < 6; index++) {
    const point = await stringPoint(page, index);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    await expect(guitar(page)).toHaveAttribute("data-armed");
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
    await page.mouse.move(point.x + 1, point.y + 1);
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
    await page.mouse.up();
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

for (const order of [
  [2, 3, 4, 5],
  [3, 2, 1, 0],
] as const) {
  test(`strumming from the middle plays ${order.join(", ")} without a press or release pluck`, async ({
    page,
  }) => {
    await open(page);
    const plucks = await watchPlucks(page);
    const first = await stringPoint(page, order[0]);
    const last = await stringPoint(page, order[3]);
    const distance = Math.hypot(last.x - first.x, last.y - first.y);
    const dx = (last.x - first.x) / distance;
    const dy = (last.y - first.y) / distance;
    // Begin within the middle string's hit area, just before its centerline.
    await page.mouse.move(first.x - dx * 2, first.y - dy * 2);
    await page.mouse.down();
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
    // Small movement across the line still leaves a click pending. A later
    // strum must retain this crossing rather than drop its first note.
    await page.mouse.move(first.x + dx * 2, first.y + dy * 2);
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
    await page.mouse.move(last.x + dx * 2, last.y + dy * 2);
    expect(await plucks.evaluate(({ hits }) => hits)).toEqual(order);
    await page.mouse.up();
    await expect(guitar(page)).not.toHaveAttribute("data-animating");
    expect(await plucks.evaluate(({ hits }) => hits)).toEqual(order);
    await plucks.evaluate((watcher) => watcher.disconnect());
    await plucks.dispose();
  });
}

test("dragging along a string and returning to the press point does not become a click", async ({
  page,
}) => {
  await open(page);
  const plucks = await watchPlucks(page);
  const first = await stringPoint(page, 0);
  const last = await stringPoint(page, 5);
  const distance = Math.hypot(last.x - first.x, last.y - first.y);
  const dx = (last.x - first.x) / distance;
  const dy = (last.y - first.y) / distance;
  const start = { x: first.x - dx * 4, y: first.y - dy * 4 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + dy * 30, start.y - dx * 30);
  await page.mouse.move(start.x, start.y);
  await page.mouse.up();
  await expect(guitar(page)).not.toHaveAttribute("data-armed");
  expect(await plucks.evaluate(({ hits }) => hits)).toEqual([]);
  await plucks.evaluate((watcher) => watcher.disconnect());
  await plucks.dispose();
});

test("cancelled clicks cannot pluck on release", async ({ page }) => {
  await open(page);
  const plucks = await watchPlucks(page);
  for (const reason of ["outside", "blur", "cancel", "capture"]) {
    const point = await stringPoint(page, 2);
    await page.mouse.move(point.x, point.y);
    await page.mouse.down();
    if (reason === "outside") await page.mouse.move(1, 1);
    else if (reason === "blur")
      await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    else if (reason === "cancel")
      await guitar(page).dispatchEvent("pointercancel", { pointerId: 1 });
    else {
      // Apply pending capture before taking it away, so the browser emits
      // lostpointercapture rather than simply cancelling a pending request.
      await page.mouse.move(point.x + 1, point.y);
      await guitar(page).evaluate((element) =>
        element.releasePointerCapture(1),
      );
      await page.mouse.move(point.x + 2, point.y);
    }
    await expect(guitar(page), reason).not.toHaveAttribute("data-armed");
    await page.mouse.move(point.x, point.y);
    await page.mouse.up();
  }
  expect(await plucks.evaluate(({ hits }) => hits)).toEqual([]);
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
    name: "Pluck string 6, low E (B♭2)",
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
    // Approved faint decorative hints; equivalent instructions remain in the figure.
    .exclude('[data-slot="rail-annotation"]')
    .analyze();
  expect(result.violations).toEqual([]);
});

for (const width of [320, 360, 767, 768, 1440]) {
  test(`selected layout keeps strings clear of copy at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await open(page);
    const copy = await page.locator("[data-hero-copy]").boundingBox();
    const instrument = await page
      .locator("[data-guitar-viewport]")
      .boundingBox();
    const panel = await page.locator("#hero-panel").boundingBox();
    if (!copy || !instrument || !panel) throw new Error("Missing hero content");
    const controls = page.locator("[data-guitar-sound-controls]");
    const button = await controls.getByRole("button").boundingBox();
    const notes = controls.getByRole("list", {
      name: "Guitar notes, high to low",
    });
    await expect(notes.getByRole("listitem")).toHaveText([
      "A♭",
      "F",
      "D♭",
      "G♭",
      "E♭",
      "B♭",
    ]);
    const column = await notes.boundingBox();
    if (!button || !column) throw new Error("Missing sound controls");
    expect(button.width).toBeGreaterThanOrEqual(44);
    expect(button.height).toBeGreaterThanOrEqual(44);
    expect(button.y - instrument.y).toBeCloseTo(
      panel.x + panel.width - button.x - button.width,
      0,
    );
    expect(column.x + column.width / 2).toBeCloseTo(
      button.x + button.width / 2,
      0,
    );
    expect(column.y).toBeGreaterThan(button.y + button.height);
    const theme = await page.locator("[data-theme-toggle]").boundingBox();
    if (!theme) throw new Error("Missing theme toggle");
    expect(button.x + button.width / 2).toBeCloseTo(
      theme.x + theme.width / 2,
      0,
    );
    const railColor = await page
      .locator('[data-slot="blueprint-rail"]')
      .evaluate((rail) => getComputedStyle(rail, "::after").borderRightColor);
    await expect(controls.locator("[data-guitar-sound-icon]")).toHaveCSS(
      "opacity",
      "0.45",
    );
    await expect(notes).toHaveCSS("color", railColor);
    expect(button.y).toBeGreaterThanOrEqual(instrument.y);
    // Keep the notes slightly above the midpoint between icon and resting string.
    // When the drawing is narrower than the rail, use its visible right edge.
    const firstStringY = await guitar(page).evaluate(
      (svg, x) => {
        if (!(svg instanceof SVGSVGElement)) throw new Error("Expected SVG");
        const matrix = svg.getScreenCTM();
        const path = svg.querySelector<SVGPathElement>("[data-string-ink]");
        if (!matrix || !path) throw new Error("Missing string");
        const from = path.getPointAtLength(0).matrixTransform(matrix);
        const to = path
          .getPointAtLength(path.getTotalLength())
          .matrixTransform(matrix);
        return from.y + ((to.y - from.y) * (x - from.x)) / (to.x - from.x);
      },
      Math.min(column.x + column.width / 2, instrument.x + instrument.width),
    );
    const midpoint = (button.y + button.height + firstStringY) / 2;
    expect(column.y + column.height / 2).toBeLessThan(midpoint);
    expect(column.y + column.height / 2).toBeGreaterThan(midpoint - 20);
    expect(column.y + column.height + 8).toBeLessThan(firstStringY);
    if (width < 768) {
      await expect(
        page.getByRole("link", { name: "Skip guitar" }),
      ).toBeVisible();
      expect(instrument.y).toBeGreaterThan(copy.y + copy.height);
      const hole = await guitar(page)
        .locator(":scope > circle")
        .first()
        .boundingBox();
      if (!hole) throw new Error("Missing sound hole");
      expect(hole.width / instrument.width).toBeGreaterThanOrEqual(0.79);
      expect(hole.x + hole.width / 2).toBeCloseTo(
        instrument.x + instrument.width / 2,
        0,
      );
      expect(hole.y + hole.height / 2).toBeCloseTo(
        instrument.y + instrument.height / 2,
        0,
      );
      expect(hole.x).toBeGreaterThan(instrument.x);
      expect(hole.x + hole.width).toBeLessThan(instrument.x + instrument.width);
    } else {
      await expect(
        page.getByRole("link", { name: "Skip guitar" }),
      ).toBeHidden();
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
  await expect(island).toHaveAttribute("component-url", /GuitarPlayer/);
  await expect(island.locator("[data-hero-copy]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /guitar design/ })).toHaveCount(
    0,
  );
  await expect(guitar(page)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test.describe("touch", () => {
  test.use({ hasTouch: true, viewport: { width: 360, height: 900 } });
  test("skip link bypasses the touch surface and resumes keyboard navigation below it", async ({
    page,
  }) => {
    await open(page);
    const skip = page.getByRole("link", { name: "Skip guitar" });
    const bounds = await skip.boundingBox();
    if (!bounds) throw new Error("Missing skip link");
    expect(bounds.height).toBeGreaterThanOrEqual(44);
    await page.locator("[data-guitar-viewport]").evaluate((element) => {
      window.scrollTo(0, scrollY + element.getBoundingClientRect().top + 120);
    });
    const reachable = await skip.boundingBox();
    const stickyHeader = await page.getByRole("banner").boundingBox();
    if (!reachable || !stickyHeader) throw new Error("Missing skip controls");
    expect(reachable.y).toBeGreaterThanOrEqual(
      stickyHeader.y + stickyHeader.height,
    );
    await expect(skip).toBeInViewport();
    await skip.tap();
    const destination = page.getByRole("region", { name: "Explore more" });
    await expect(destination).toBeFocused();
    await expect(destination).toBeInViewport();
    expect(new URL(page.url()).hash).toBe("#after-guitar");
    await expect(guitar(page)).not.toBeInViewport();
    await expect(guitar(page)).not.toHaveAttribute("data-armed");
    await expect(page.locator("[data-guitar-player]")).toHaveAttribute(
      "data-audio-state",
      "off",
    );
    const target = await destination.boundingBox();
    const header = await page.getByRole("banner").boundingBox();
    if (!target || !header) throw new Error("Missing navigation landmarks");
    expect(target.y).toBeGreaterThanOrEqual(header.y + header.height);
    await page.keyboard.press("Tab");
    await expect(
      destination.getByRole("link", {
        name: "The people around me",
        exact: true,
      }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      destination.getByRole("link", { name: "UWCCSC", exact: true }),
    ).toBeFocused();
  });
  test("a tap plucks only the selected string on release", async ({
    page,
    context,
  }) => {
    await open(page);
    await guitar(page).scrollIntoViewIfNeeded();
    const session = await context.newCDPSession(page);
    for (let index = 0; index < 6; index++) {
      const point = await stringPoint(page, index);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [point],
      });
      await expect(guitar(page)).toHaveAttribute("data-armed");
      await expect(guitar(page)).not.toHaveAttribute("data-animating");
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
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
  for (const offset of [-3, 3]) {
    test(`touch capture transferring from a string preserves taps and strums (${offset}px)`, async ({
      page,
      context,
    }) => {
      await open(page);
      await guitar(page).scrollIntoViewIfNeeded();
      const session = await context.newCDPSession(page);
      const point = await stringPoint(page, 0);
      // Stay inside the first string's hit area, but away from its centerline:
      // subpixel rounding at the line changes whether a strum crosses it.
      point.y += offset;
      const pointer = await guitar(page).evaluateHandle((svg) => {
        const touch: { id: number; string: string | null } = {
          id: -1,
          string: null,
        };
        svg.addEventListener("pointerdown", (event) => {
          if (event instanceof PointerEvent) {
            touch.id = event.pointerId;
            touch.string =
              event.target instanceof Element
                ? (event.target
                    .closest("[data-guitar-string]")
                    ?.getAttribute("data-guitar-string") ?? null)
                : null;
          }
        });
        return touch;
      });
      for (const strum of [false, true]) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [point],
        });
        await expect(guitar(page)).toHaveAttribute("data-armed");
        expect(await pointer.evaluate((touch) => touch.string)).toBe("0");
        // Replay the old target's bubbling capture-loss event during a transfer.
        // Losing a child's capture must not cancel capture owned by the SVG.
        await guitar(page).evaluate(
          (svg, id) => {
            const hit = svg.querySelector("[data-string-hit]");
            if (!hit) throw new Error("Missing string hit area");
            if (!svg.hasPointerCapture(id))
              throw new Error("Missing touch capture");
            hit.dispatchEvent(
              new PointerEvent("lostpointercapture", {
                bubbles: true,
                pointerId: id,
                pointerType: "touch",
              }),
            );
          },
          await pointer.evaluate((touch) => touch.id),
        );
        await expect(guitar(page)).toHaveAttribute("data-armed");
        if (strum) {
          const { end } = await crossing(page);
          await session.send("Input.dispatchTouchEvent", {
            type: "touchMove",
            touchPoints: [end],
          });
          await expect(guitar(page).locator("[data-vibrating]")).toHaveCount(
            offset < 0 ? 6 : 5,
          );
        }
        await session.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await expect(guitar(page)).not.toHaveAttribute("data-armed");
        if (!strum)
          await expect(guitar(page).locator("[data-vibrating]")).toHaveCount(1);
        await expect(guitar(page).locator("[data-vibrating]")).toHaveCount(0);
      }
      await pointer.dispose();
    });
  }
});

test.describe("mobile without JavaScript", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 360, height: 900 } });
  test("skip guitar works before any client enhancement", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "Skip guitar" });
    await skip.focus();
    await page.keyboard.press("Enter");
    const destination = page.getByRole("region", { name: "Explore more" });
    await expect(destination).toBeFocused();
    await expect(destination).toBeInViewport();
    expect(new URL(page.url()).hash).toBe("#after-guitar");
  });
});
