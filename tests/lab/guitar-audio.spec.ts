import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  observeGuitarAudio,
  guitarNotes as notes,
} from "../support/guitar-audio";
const audition = (page: Page) => page.locator("[data-guitar-audition]");
const guitar = (page: Page) => page.locator("[data-guitar]");

async function open(page: Page) {
  await observeGuitarAudio(page);
  await page.goto("/lab/guitar");
  await expect(guitar(page)).toHaveAttribute("data-ready");
}

async function enable(page: Page) {
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await expect(audition(page)).toHaveAttribute("data-audio-state", "ready");
}

test("audio stays unloaded until enabled, and switching libraries reuses decoded recordings", async ({
  page,
}) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  await expect(
    page.getByRole("radio", { name: /Quartertone classical/ }),
  ).toBeChecked();
  await page.getByRole("radio", { name: /Acoustic archtop/ }).check();
  await expect(page.getByRole("button", { name: /^Play string / })).toHaveText([
    "B♭2",
    "E♭3",
    "G♭3",
    "D♭4",
    "F4",
    "A♭4",
  ]);
  await expect(
    page.getByText("E♭m11/B♭ · 6–6–4–6–6–4", { exact: true }),
  ).toBeVisible();
  await expect(
    guitar(page).getByRole("button", {
      name: "Pluck string 5, A (E♭3)",
      exact: true,
    }),
  ).toHaveCount(1);
  expect(
    requests.filter((url) =>
      /\/tone\.js(?:\?|$)|\/assets\/guitar\/.*\.(mp3|wav)$/.test(url),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(() => window.guitarAudioProbe.contexts.length),
  ).toBe(0);
  await guitar(page).locator('[data-guitar-string="0"]').press("Enter");
  expect(await notes(page)).toEqual([]);
  await enable(page);
  const audioRequests = () =>
    requests.filter((url) => /assets\/guitar\/.*\.(mp3|wav)$/.test(url));
  expect(audioRequests()).toHaveLength(48);
  expect(
    await page.evaluate(
      () =>
        window.guitarAudioProbe.contexts.filter(
          (context) => context.state !== "closed",
        ).length,
    ),
  ).toBe(1);
  await page
    .getByRole("button", { name: "Play string 1, A♭4", exact: true })
    .click();
  await expect.poll(async () => (await notes(page)).length).toBe(1);
  await expect
    .poll(async () => (await notes(page))[0]?.rate)
    .toBeCloseTo(2 ** (5 / 12));
  for (const [name, count] of [
    [/Steel-string acoustic/, 58],
    [/Quartertone classical/, 82],
    [/University of Iowa/, 100],
  ] as const) {
    await page.getByRole("radio", { name }).check();
    await expect(audition(page)).toHaveAttribute("data-audio-state", "ready");
    expect(audioRequests()).toHaveLength(count);
    const before = (await notes(page)).length;
    for (const [index, fret] of [4, 6, 6, 4, 6, 6].entries()) {
      await page
        .getByRole("button", {
          name: new RegExp(`^Play string ${index + 1}, `),
        })
        .click();
      await expect
        .poll(async () => (await notes(page))[before + index]?.rate)
        .toBeCloseTo(2 ** (fret / 12));
    }
    expect((await notes(page)).slice(before)).toHaveLength(6);
  }
  await page.getByRole("radio", { name: /Acoustic archtop/ }).check();
  await expect(audition(page)).toHaveAttribute("data-audio-state", "ready");
  expect(audioRequests()).toHaveLength(100);
  await page.getByRole("button", { name: "Mute sound" }).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.guitarAudioProbe.contexts.every(
          (context) => context.state === "closed",
        ),
      ),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});

test("the reference phrase schedules six plucks and two ordered strums; stopping cancels every voice", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await open(page);
  await enable(page);
  await page.getByRole("button", { name: "Play comparison phrase" }).click();
  await expect.poll(async () => (await notes(page)).length).toBe(18);
  const scheduled = await notes(page);
  const first = scheduled[0]?.when ?? 0;
  const expected = [
    0, 0.3, 0.6, 0.9, 1.2, 1.5, 2.2, 2.235, 2.27, 2.305, 2.34, 2.375, 3.4,
    3.435, 3.47, 3.505, 3.54, 3.575,
  ];
  scheduled.forEach((note, index) =>
    expect(note.when - first).toBeCloseTo(expected[index] ?? -1, 1),
  );
  await page.getByRole("button", { name: "Stop", exact: true }).click();
  await expect
    .poll(async () => (await notes(page)).every((note) => note.disconnected))
    .toBe(true);
  await expect(guitar(page)).not.toHaveAttribute("data-animating");
  await page.getByRole("button", { name: "Play comparison phrase" }).click();
  await expect.poll(async () => (await notes(page)).length).toBe(36);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect
    .poll(async () => (await notes(page)).every((note) => note.disconnected))
    .toBe(true);
  expect(errors).toEqual([]);
});

test("sample failures and cancelled loads leave the guitar silent and can be retried", async ({
  page,
}) => {
  const sampleRoute = /\/assets\/guitar\/.*\.mp3$/;
  await page.route(sampleRoute, (route) =>
    route.fulfill({ status: 503, body: "Unavailable" }),
  );
  await open(page);
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await expect(audition(page)).toHaveAttribute("data-audio-state", "error");
  expect(await notes(page)).toEqual([]);
  await page.unroute(sampleRoute);
  // Leave requests pending to exercise the engine's own AbortController.
  await page.route(sampleRoute, () => {});
  await page.getByRole("button", { name: "Enable sound", exact: true }).click();
  await page.getByRole("button", { name: "Cancel loading" }).click();
  await expect(audition(page)).toHaveAttribute("data-audio-state", "off");
  await page.unroute(sampleRoute);
  await enable(page);
  await page
    .getByRole("button", { name: "Play string 6, B♭2", exact: true })
    .click();
  await expect.poll(async () => (await notes(page)).length).toBe(1);
});

test("release plucks and middle-start strums schedule distinct notes; hover and press stay silent", async ({
  page,
}) => {
  await open(page);
  await enable(page);
  await guitar(page).scrollIntoViewIfNeeded();
  const { first, last } = await guitar(page).evaluate((svg) => {
    if (!(svg instanceof SVGSVGElement)) throw new Error("Expected guitar SVG");
    const matrix = svg.getScreenCTM();
    const strings = svg.querySelectorAll<SVGPathElement>("[data-string-ink]");
    const point = (index: number) => {
      const path = strings[index];
      if (!path || !matrix) throw new Error("Missing string");
      const p = path
        .getPointAtLength(path.getTotalLength() / 2)
        .matrixTransform(matrix);
      return { x: p.x, y: p.y };
    };
    return { first: point(2), last: point(5) };
  });
  await page.mouse.move(first.x, first.y);
  await page.mouse.move(last.x, last.y);
  expect(await notes(page)).toEqual([]);
  await page.mouse.move(first.x, first.y);
  await page.mouse.down();
  expect(await notes(page)).toEqual([]);
  await page.mouse.up();
  await expect.poll(async () => (await notes(page)).length).toBe(1);
  const distance = Math.hypot(last.x - first.x, last.y - first.y);
  const dx = (last.x - first.x) / distance;
  const dy = (last.y - first.y) / distance;
  await page.mouse.move(first.x - dx * 2, first.y - dy * 2);
  await page.mouse.down();
  await page.mouse.move(first.x + dx * 2, first.y + dy * 2);
  expect(await notes(page)).toHaveLength(1);
  await page.mouse.move(last.x + dx * 2, last.y + dy * 2);
  await expect.poll(async () => (await notes(page)).length).toBe(5);
  await page.mouse.up();
  expect(await notes(page)).toHaveLength(5);
  await guitar(page).locator('[data-guitar-string="5"]').press("Enter");
  await expect.poll(async () => (await notes(page)).length).toBe(6);
  await page.getByRole("button", { name: "Mute sound" }).click();
  await guitar(page).locator('[data-guitar-string="5"]').press("Enter");
  expect(await notes(page)).toHaveLength(6);
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`audition is accessible and fits at 360px in ${colorScheme}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 900 });
    await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
    await open(page);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(360);
    const accessibility = await new AxeBuilder({ page }).analyze();
    expect(accessibility.violations).toEqual([]);
  });
}
