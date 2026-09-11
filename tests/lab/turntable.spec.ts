import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { needlePosition } from "../../src/lib/turntable-geometry";
import { silentWav } from "../support/audio";

const player = (page: Page) => page.getByRole("main").locator("local-record");
const arm = (page: Page) =>
  player(page).getByRole("slider", { name: "Tonearm position" });
const paused = (page: Page) =>
  player(page)
    .locator("audio")
    .evaluate((node) => {
      if (!(node instanceof HTMLAudioElement))
        throw new Error("Expected audio");
      return node.paused;
    });
const spinning = (page: Page) =>
  player(page)
    .locator("[data-turntable-disc]")
    .evaluate((node) =>
      node
        .getAnimations()
        .some((animation) => animation.playState === "running"),
    );

async function openPlayer(page: Page) {
  await page.route("**/jazz-n-brass-demo.mp3*", (route) =>
    route.fulfill({ contentType: "audio/wav", body: silentWav() }),
  );
  await page.goto("/lab/turntable");
  await page.locator("[data-audio-file]").setInputFiles({
    name: "fixture.wav",
    mimeType: "audio/wav",
    buffer: silentWav(),
  });
  await player(page).scrollIntoViewIfNeeded();
  await expect(arm(page)).toHaveAttribute("tabindex", "0");
}

async function vinylPoint(page: Page) {
  return player(page)
    .locator("svg")
    .evaluate((svg) => {
      if (!(svg instanceof SVGSVGElement)) throw new Error("Expected SVG");
      const matrix = svg.getScreenCTM();
      if (!matrix) throw new Error("Missing SVG transform");
      const point = new DOMPoint(100, 100).matrixTransform(matrix);
      return { x: point.x, y: point.y, scale: matrix.d };
    });
}

const selected = (page: Page) =>
  player(page).locator("[data-record-track][data-active]");

test("swiping a playing record returns the arm smoothly without reversing direction", async ({
  page,
}) => {
  await openPlayer(page);
  await arm(page).press("Enter");
  await expect.poll(() => spinning(page)).toBe(true);
  const motion = await arm(page).evaluateHandle((node) => ({
    finished: new Promise<number[]>((resolve) => {
      if (!(node instanceof SVGGraphicsElement))
        throw new Error("Expected SVG arm");
      const angle = () => {
        const matrix = node.getCTM();
        if (!matrix) throw new Error("Missing arm transform");
        return (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
      };
      document.addEventListener(
        "pointerdown",
        () => {
          const samples = [angle()];
          const start = performance.now();
          const sample = () => {
            samples.push(angle());
            if (performance.now() - start < 700) requestAnimationFrame(sample);
            else resolve(samples);
          };
          requestAnimationFrame(sample);
        },
        { once: true, capture: true },
      );
    }),
  }));
  const start = await vinylPoint(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x, start.y - 70 * start.scale, { steps: 8 });
  await page.mouse.up();
  const angles = await motion.evaluate(async ({ finished }) => finished);
  await motion.dispose();
  expect(angles[0]).toBeGreaterThan(20);
  expect(angles.at(-1)).toBeCloseTo(0);
  expect(angles.some((angle) => angle > 1 && angle < 23)).toBe(true);
  const reversals = angles.slice(1).filter((angle, index) => {
    const previous = angles[index];
    return previous !== undefined && angle > previous + 0.1;
  });
  expect(reversals, `Arm angles: ${angles.join(", ")}`).toEqual([]);
});

test("a vertical vinyl swipe pauses audio, parks the arm, and loads the next record only on play", async ({
  page,
}) => {
  await openPlayer(page);
  await arm(page).press("Enter");
  await expect.poll(() => paused(page)).toBe(false);
  const before = await player(page).boundingBox();
  const start = await vinylPoint(page);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await expect.poll(() => paused(page)).toBe(true);
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "0");
  await page.mouse.move(start.x, start.y - 70 * start.scale, { steps: 8 });
  await page.mouse.up();
  await expect(selected(page)).toHaveAttribute("data-track-id", "swap-demo");
  await expect(
    player(page).locator("[data-vinyl-design][data-active]"),
  ).toHaveAttribute("data-vinyl-design", "1");
  await expect(
    player(page).locator("[data-record-position], [data-record-navigation]"),
  ).toHaveCount(0);
  await expect(player(page).locator("audio")).not.toHaveAttribute("src");
  await expect(
    player(page).locator("[data-turntable-record]"),
  ).not.toHaveAttribute("data-changing");
  expect((await player(page).boundingBox())?.height).toBe(before?.height);
  await arm(page).press("Enter");
  await expect.poll(() => paused(page)).toBe(false);
  await arm(page).press("Home");
});

test("keyboard vinyl selection wraps in both directions without motion when reduced motion is requested", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openPlayer(page);
  const record = player(page).getByRole("button", { name: "Change record" });
  await record.focus();
  await record.press("Enter");
  await expect(selected(page)).toHaveAttribute("data-track-id", "swap-demo");
  await expect(record).toBeFocused();
  await record.press("ArrowUp");
  await expect(selected(page)).toHaveAttribute("data-track-id", "jazz-demo");
  await expect(
    player(page).locator("[data-vinyl-design][data-active]"),
  ).toHaveAttribute("data-vinyl-design", "0");
  await record.press("ArrowDown");
  await expect(selected(page)).toHaveAttribute("data-track-id", "swap-demo");
  expect(await paused(page)).toBe(true);
  expect(
    await player(page)
      .locator("[data-turntable-record]")
      .evaluate((node) => node.getAnimations().length),
  ).toBe(0);
  const result = await new AxeBuilder({ page })
    .exclude("astro-dev-toolbar")
    .analyze();
  expect(result.violations).toEqual([]);
});

test("disconnecting during a swap cancels motion and releases playback", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await openPlayer(page);
  await arm(page).press("Enter");
  await expect.poll(() => paused(page)).toBe(false);
  await player(page)
    .getByRole("button", { name: "Change record" })
    .press("ArrowUp");
  await expect(player(page).locator("[data-turntable-record]")).toHaveAttribute(
    "data-changing",
  );
  const result = await player(page).evaluate(async (node) => {
    const audio = node.querySelector("audio");
    const record = node.querySelector<SVGElement>("[data-turntable-record]");
    // Capture completion promises before cancel() replaces them with new pending ones.
    const finished = node
      .getAnimations({ subtree: true })
      .map((animation) => animation.finished.catch(() => {}));
    node.remove();
    await Promise.all(finished);
    return {
      paused: audio?.paused,
      source: audio?.getAttribute("src"),
      changing: record?.hasAttribute("data-changing"),
      animations: node.getAnimations({ subtree: true }).length,
    };
  });
  expect(result).toEqual({
    paused: true,
    source: null,
    changing: false,
    animations: 0,
  });
  expect(errors).toEqual([]);
});

test("short and cancelled vinyl drags return the record without changing the song", async ({
  page,
}) => {
  await openPlayer(page);
  for (const cancel of [false, true]) {
    const start = await vinylPoint(page);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(start.x, start.y - (cancel ? 80 : 10) * start.scale);
    if (cancel) await page.keyboard.press("Escape");
    await page.mouse.up();
    await expect
      .poll(() =>
        player(page)
          .locator("[data-turntable-record]")
          .evaluate((node) => getComputedStyle(node).transform),
      )
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
    await expect(selected(page)).toHaveAttribute("data-track-id", "jazz-demo");
  }
});

async function point(page: Page, angle: number) {
  return player(page)
    .locator("svg")
    .evaluate((svg, needle) => {
      if (!(svg instanceof SVGSVGElement)) throw new Error("Expected SVG");
      const matrix = svg.getScreenCTM();
      if (!matrix) throw new Error("Missing SVG transform");
      const point = new DOMPoint(needle.x, needle.y).matrixTransform(matrix);
      return { x: point.x, y: point.y };
    }, needlePosition(angle));
}

async function drag(page: Page, from: number, to: number) {
  const start = await point(page, from);
  const end = await point(page, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
}

test("dragging the cartridge controls real audio and respects the fixed pivot", async ({
  page,
}) => {
  await openPlayer(page);
  await expect(player(page).locator("audio")).not.toHaveAttribute("src");
  await expect(player(page).locator("audio")).toBeHidden();
  await expect(player(page).locator("audio")).not.toHaveAttribute("controls");
  await drag(page, 0, 24);
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "24");
  await expect.poll(() => paused(page)).toBe(false);
  await expect.poll(() => spinning(page)).toBe(true);
  await expect
    .poll(() =>
      player(page)
        .locator("audio")
        .evaluate((node) => {
          if (!(node instanceof HTMLAudioElement))
            throw new Error("Expected audio");
          return node.currentTime;
        }),
    )
    .toBeGreaterThan(0);

  const start = await point(page, 24);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await expect.poll(() => paused(page)).toBe(true);
  const end = await point(page, 0);
  await page.mouse.move(end.x, end.y, { steps: 8 });
  await page.mouse.up();
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "0");
  expect(await spinning(page)).toBe(false);

  // Clicking the record body does not start playback.
  await player(page)
    .locator("svg")
    .click({ position: { x: 120, y: 120 } });
  expect(await paused(page)).toBe(true);
});

test("keyboard control, reduced motion, and media pause stay synchronized", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
  await openPlayer(page);
  await arm(page).press("Enter");
  await expect.poll(() => paused(page)).toBe(false);
  expect(await spinning(page)).toBe(false);
  await arm(page).press("End");
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "34");
  await arm(page).press("ArrowRight");
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "34");
  await player(page)
    .locator("audio")
    .evaluate((node) => {
      if (!(node instanceof HTMLAudioElement))
        throw new Error("Expected audio");
      node.pause();
    });
  await expect(player(page).locator("turntable-control")).not.toHaveAttribute(
    "playing",
  );
  await arm(page).press("Home");
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "0");
  const result = await new AxeBuilder({ page })
    .exclude("astro-dev-toolbar")
    .analyze();
  expect(result.violations).toEqual([]);
});

test("cancelled gestures and removed players release audio and animation", async ({
  page,
}) => {
  await openPlayer(page);
  const start = await point(page, 0);
  const end = await point(page, 24);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y);
  await page.keyboard.press("Escape");
  await page.mouse.up();
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "0");
  expect(await paused(page)).toBe(true);
  await drag(page, 0, 24);
  await expect.poll(() => spinning(page)).toBe(true);
  const result = await player(page).evaluate((node) => {
    const audio = node.querySelector("audio");
    const animations = node.getAnimations({ subtree: true });
    node.remove();
    return {
      paused: audio?.paused,
      animations: animations.map((animation) => animation.playState),
    };
  });
  expect(result.paused).toBe(true);
  expect(result.animations.length).toBeGreaterThan(0);
  expect(result.animations.every((state) => state === "idle")).toBe(true);
});

test("an interrupted load never reports playing or a spurious error", async ({
  page,
}) => {
  let release: () => void = () => {};
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/delayed-audio.wav", async (route) => {
    await waiting;
    await route.fulfill({ contentType: "audio/wav", body: silentWav() });
  });
  await page.goto("/lab/turntable");
  await player(page).evaluate((node) =>
    node.setAttribute("data-src", "/delayed-audio.wav"),
  );
  await arm(page).press("Enter");
  expect(await spinning(page)).toBe(false);
  await expect(player(page)).toHaveAttribute("data-audio-state", "loading");
  await expect(player(page).locator("[data-audio-status]")).toHaveText(
    "Loading recording…",
  );
  await expect(player(page).locator("[data-audio-status]")).toHaveClass(
    "sr-only",
  );
  await arm(page).press("Home");
  release();
  await expect.poll(() => paused(page)).toBe(true);
  await expect(player(page)).toHaveAttribute("data-audio-state", "paused");
  await expect(player(page).locator("[data-audio-error]")).toBeHidden();
  expect(await spinning(page)).toBe(false);
});

test.describe("touch", () => {
  test.use({ hasTouch: true, viewport: { width: 360, height: 900 } });
  test("vertical vinyl swipes select in both directions without scrolling the page", async ({
    page,
    context,
  }) => {
    await openPlayer(page);
    const session = await context.newCDPSession(page);
    const scroll = await page.evaluate(() => window.scrollY);
    for (const [distance, id] of [
      [-80, "swap-demo"],
      [80, "jazz-demo"],
    ] as const) {
      const start = await vinylPoint(page);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: start.x, y: start.y }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: start.x, y: start.y + distance * start.scale }],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect(selected(page)).toHaveAttribute("data-track-id", id);
      await expect(
        player(page).locator("[data-turntable-record]"),
      ).not.toHaveAttribute("data-changing");
    }
    expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
    expect(await paused(page)).toBe(true);
  });
  test("the arm stops at both limits without horizontal overflow", async ({
    page,
    context,
  }) => {
    await openPlayer(page);
    const session = await context.newCDPSession(page);
    for (const [from, to, expected] of [
      [0, 70, 34],
      [34, -40, 0],
    ] as const) {
      const start = await point(page, from);
      const end = await point(page, to);
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [start],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [end],
      });
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
      await expect(arm(page)).toHaveAttribute(
        "aria-valuenow",
        String(expected),
      );
    }
    expect(await paused(page)).toBe(true);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(360);
  });
});
