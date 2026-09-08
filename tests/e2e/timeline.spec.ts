import { expect, test } from "@playwright/test";

test("focused keys reach both ends without moving the page", async ({
  page,
}) => {
  await page.goto("/#after-guitar");
  const timeline = page.getByRole("region", {
    name: "Life events, newest first",
  });
  await timeline.scrollIntoViewIfNeeded();
  const pageTop = await page.evaluate(() => scrollY);
  await timeline.focus();
  await page.keyboard.press("End");
  await expect(
    timeline.getByRole("heading", { name: "UWCCSC" }),
  ).toBeInViewport();
  await expect(timeline).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(pageTop, 0);
  await page.keyboard.press("Home");
  await expect.poll(() => timeline.evaluate((el) => el.scrollLeft)).toBe(0);
  const firstDateLeft = await timeline
    .locator("time")
    .first()
    .evaluate((el) => el.getBoundingClientRect().left);
  await page.keyboard.press("ArrowRight");
  await expect
    .poll(() =>
      timeline
        .locator("time")
        .nth(1)
        .evaluate((el) => el.getBoundingClientRect().left),
    )
    .toBeCloseTo(firstDateLeft, 0);
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => timeline.evaluate((el) => el.scrollLeft)).toBe(0);
});

test("wheel gestures move horizontally and hand back to the page at both ends", async ({
  page,
}) => {
  await page.goto("/#after-guitar");
  const timeline = page.locator("#life-timeline");
  await timeline.hover();
  await page.mouse.wheel(410, 0);
  await expect
    .poll(() => timeline.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(300);
  const pageTop = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => timeline.evaluate((el) => el.scrollLeft))
    .toBeGreaterThan(550);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(pageTop, 0);
  await timeline.press("End");
  await expect
    .poll(() =>
      timeline.evaluate(
        (el) => el.scrollWidth - el.clientWidth - el.scrollLeft,
      ),
    )
    .toBeLessThanOrEqual(1);
  await timeline.hover();
  await page.mouse.wheel(0, 200);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeGreaterThan(pageTop + 100);
  await timeline.press("Home");
  await expect.poll(() => timeline.evaluate((el) => el.scrollLeft)).toBe(0);
  await timeline.hover();
  const beforeUp = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -200);
  await expect
    .poll(() => page.evaluate(() => scrollY))
    .toBeLessThan(beforeUp - 100);
});

test("keyboard focus reveals linked milestones with sketch underlines", async ({
  page,
}) => {
  await page.goto("/#after-guitar");
  const timeline = page.locator("#life-timeline");
  await timeline.focus();
  await page.keyboard.press("Tab");
  const cave = timeline.getByRole("link", { name: "the Cave" });
  await expect(cave).toBeFocused();
  await expect(cave).toBeInViewport();
  await expect(cave).toHaveAttribute(
    "href",
    "https://www.instagram.com/cc_thecave/",
  );
  await cave.hover();
  await expect(cave.locator("sketch-underline svg")).toHaveCSS(
    "visibility",
    "visible",
  );
  await page.keyboard.press("Tab");
  const zacc = timeline.getByRole("link", { name: "Zacc" });
  await expect(zacc).toBeFocused();
  await expect(zacc).toBeInViewport();
  await expect(zacc).toHaveAttribute(
    "href",
    "https://open.spotify.com/artist/1e5b1Cd0y4klUqfkLsksDx",
  );
});

test("reduced motion scrolls immediately", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/#after-guitar");
  const timeline = page.locator("#life-timeline");
  await expect(timeline).toHaveCSS("scroll-behavior", "auto");
  await timeline.focus();
  await page.keyboard.press("End");
  expect(
    await timeline.evaluate(
      (el) => el.scrollWidth - el.clientWidth - el.scrollLeft,
    ),
  ).toBeLessThanOrEqual(1);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every milestone remains reachable through native scrolling", async ({
    page,
  }) => {
    await page.goto("/#after-guitar");
    const timeline = page.locator("#life-timeline");
    await expect(timeline.locator("li")).toHaveCount(11);
    await expect(
      page.getByRole("button", { name: "Earlier events" }),
    ).toBeHidden();
    await timeline.hover();
    await page.mouse.wheel(4000, 0);
    await expect(
      timeline.getByRole("heading", { name: "UWCCSC" }),
    ).toBeInViewport();
  });
});

test.describe("touch", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });

  test("a horizontal swipe moves events and a vertical swipe scrolls the page", async ({
    page,
    context,
  }) => {
    await page.goto("/#after-guitar");
    const timeline = page.locator("#life-timeline");
    await timeline.scrollIntoViewIfNeeded();
    const box = await timeline.boundingBox();
    if (!box) throw new Error("Timeline is missing");
    const session = await context.newCDPSession(page);
    const start = { x: box.x + box.width * 0.8, y: box.y + 70 };
    const swipe = async (dx: number, dy: number) => {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [start],
      });
      for (let i = 1; i <= 6; i++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [
            { x: start.x + (dx * i) / 6, y: start.y + (dy * i) / 6 },
          ],
        });
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    };
    await swipe(-170, 0);
    await expect
      .poll(() => timeline.evaluate((el) => el.scrollLeft))
      .toBeGreaterThan(100);
    const pageTop = await page.evaluate(() => scrollY);
    await swipe(0, -160);
    await expect
      .poll(() => page.evaluate(() => scrollY))
      .toBeGreaterThan(pageTop + 50);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await session.detach();
  });
});
