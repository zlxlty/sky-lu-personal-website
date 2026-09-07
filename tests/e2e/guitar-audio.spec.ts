import { expect, test, type Page } from "@playwright/test";
import { observeGuitarAudio, guitarNotes } from "../support/guitar-audio";

const player = (page: Page) => page.locator("[data-guitar-player]");
const string = (page: Page, index: number) =>
  player(page).locator(`[data-guitar-string="${index}"]`);
async function open(page: Page) {
  await observeGuitarAudio(page);
  await page.goto("/");
  await expect(
    player(page).getByRole("button", { name: "Enable sound" }),
  ).toBeEnabled();
}
async function enable(page: Page) {
  await player(page).getByRole("button", { name: "Enable sound" }).click();
  await expect(player(page)).toHaveAttribute("data-audio-state", "ready");
}
async function expectClosed(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.guitarAudioProbe.contexts.every(
          (context) => context.state === "closed",
        ),
      ),
    )
    .toBe(true);
}

test("homepage loads only 24 Yamaha recordings after activation and plays the E-flat voicing", async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  const recordings = () =>
    requests.filter((url) => /\.(mp3|wav)(?:\?|$)/.test(url));
  expect(recordings()).toEqual([]);
  expect(
    requests.filter((url) =>
      /quartertone-bank|GuitarAudition|guitar-samples/.test(url),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(() => window.guitarAudioProbe.contexts.length),
  ).toBe(0);
  await string(page, 0).press("Enter");
  expect(await guitarNotes(page)).toEqual([]);
  await enable(page);
  expect(recordings()).toHaveLength(24);
  expect(await guitarNotes(page)).toEqual([]);
  for (const [index, fret] of [4, 6, 6, 4, 6, 6].entries()) {
    await string(page, index).press("Enter");
    // AudioParam automation becomes observable on the next audio render quantum.
    await expect
      .poll(async () => (await guitarNotes(page))[index]?.rate)
      .toBeCloseTo(2 ** (fret / 12));
  }
  expect(await guitarNotes(page)).toHaveLength(6);
  await expect(player(page).getByRole("slider")).toHaveCount(0);
  await player(page).getByRole("button", { name: "Mute sound" }).click();
  await expectClosed(page);
  await string(page, 0).press("Enter");
  expect(await guitarNotes(page)).toHaveLength(6);
  expect(errors).toEqual([]);
});

test("cancelling a pending load closes its context and a new activation can retry", async ({
  page,
}) => {
  let release: () => void = () => {};
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/*.mp3", async (route) => {
    await pending;
    await route.continue();
  });
  await open(page);
  const requested = page.waitForRequest(/\.mp3$/);
  await player(page).getByRole("button", { name: "Enable sound" }).click();
  await requested;
  await player(page).getByRole("button", { name: "Cancel loading" }).click();
  await expect(player(page)).toHaveAttribute("data-audio-state", "off");
  await expectClosed(page);
  release();
  await enable(page);
  expect(await guitarNotes(page)).toEqual([]);
});

test("a failed recording load offers retry while visual plucking remains usable", async ({
  page,
}) => {
  let failed = false;
  await page.route("**/*.mp3", async (route) => {
    if (!failed) {
      failed = true;
      await route.fulfill({ status: 503, body: "Unavailable" });
    } else await route.continue();
  });
  await open(page);
  await player(page).getByRole("button", { name: "Enable sound" }).click();
  await expect(player(page)).toHaveAttribute("data-audio-state", "error");
  await expectClosed(page);
  await string(page, 0).press("Enter");
  await expect(string(page, 0)).toHaveAttribute("data-vibrating");
  expect(await guitarNotes(page)).toEqual([]);
  await player(page).getByRole("button", { name: "Retry sound" }).click();
  await expect(player(page)).toHaveAttribute("data-audio-state", "ready");
});

test("blur and leaving the hero stop notes; pagehide disposes the audio", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 600 });
  await open(page);
  await enable(page);
  await string(page, 2).press("Enter");
  await expect.poll(async () => (await guitarNotes(page)).length).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect
    .poll(async () =>
      (await guitarNotes(page)).every((note) => note.disconnected),
    )
    .toBe(true);
  await string(page, 3).press("Enter");
  await expect.poll(async () => (await guitarNotes(page)).length).toBe(2);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(player(page)).not.toBeInViewport();
  await expect
    .poll(async () =>
      (await guitarNotes(page)).every((note) => note.disconnected),
    )
    .toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(player(page)).toHaveAttribute("data-audio-state", "off");
  await expectClosed(page);
});

test.describe("touch audio", () => {
  test.use({ hasTouch: true, viewport: { width: 360, height: 900 } });
  test("explicit touch activation unlocks a release pluck", async ({
    page,
  }) => {
    await open(page);
    await player(page).getByRole("button", { name: "Enable sound" }).tap();
    await expect(player(page)).toHaveAttribute("data-audio-state", "ready");
    const svg = player(page).locator("[data-guitar]");
    await svg.scrollIntoViewIfNeeded();
    const point = await svg.evaluate((element) => {
      if (!(element instanceof SVGSVGElement)) throw new Error("Expected SVG");
      const path = element.querySelector<SVGPathElement>("[data-string-ink]");
      const matrix = element.getScreenCTM();
      if (!path || !matrix) throw new Error("Missing string");
      const point = path
        .getPointAtLength(path.getTotalLength() / 2)
        .matrixTransform(matrix);
      return { x: point.x, y: point.y };
    });
    await page.touchscreen.tap(point.x, point.y);
    await expect.poll(async () => (await guitarNotes(page)).length).toBe(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(360);
  });
});
