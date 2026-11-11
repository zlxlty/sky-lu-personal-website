import { expect, test, type Page } from "@playwright/test";
import { silentWav } from "../support/audio";

const waves = (page: Page) => page.locator("sound-waves");
const line = (page: Page) => waves(page).locator("[data-sound-line]");
const guitar = (page: Page) => page.locator("[data-guitar-player]");
const record = (page: Page) => page.locator("local-record");
const arm = (page: Page) =>
  record(page).getByRole("slider", { name: "Tonearm position" });

/**
 * What is drawn on the canvas, in CSS pixels: how far the waves `reach` above
 * or below the base line, and how far `right` of the left rail they extend.
 */
const drawn = (page: Page) =>
  waves(page)
    .locator("canvas")
    .evaluate((canvas: HTMLCanvasElement) => {
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Missing canvas");
      const { width, height } = canvas;
      const ratio = height / canvas.getBoundingClientRect().height;
      const pixels = context.getImageData(0, 0, width, height).data;
      let reach = 0;
      let right = 0;
      for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++)
          if ((pixels[(y * width + x) * 4 + 3] ?? 0) > 24) {
            reach = Math.max(reach, Math.abs(y + 0.5 - (height + ratio) / 2));
            right = Math.max(right, x);
          }
      return { reach: reach / ratio, right: right / ratio };
    });
const reach = async (page: Page) => (await drawn(page)).reach;

/** Silence leaves a slow ripple a few pixels tall. */
async function expectRest(page: Page) {
  await expect.poll(() => reach(page)).toBeLessThan(6);
  await expect.poll(() => reach(page)).toBeGreaterThan(0.5);
}

/** Serve a silent recording and a spectrum that is loud throughout. */
async function stubRecord(page: Page) {
  const spectra: string[] = [];
  await page.route("https://audio.skylu.me/**", (route) =>
    route.fulfill({ contentType: "audio/wav", body: silentWav() }),
  );
  await page.route("**/*.bin", (route) => {
    spectra.push(route.request().url());
    return route.fulfill({
      contentType: "application/octet-stream",
      body: Buffer.from([17, 20, ...new Array<number>(17 * 20 * 30).fill(255)]),
    });
  });
  return spectra;
}

async function play(page: Page) {
  await arm(page).focus();
  await arm(page).press("Enter");
  await expect(record(page)).toHaveAttribute("data-audio-state", "playing");
  await page.evaluate(() => scrollTo(0, 0));
}

/** Pages headed by waves: the title under them, the text below it, and how far right the waves reach. */
const pages = [
  {
    path: "/",
    title: "#hero-heading",
    letters: "#hero-heading span > span",
    text: "[data-hero-copy] > p",
    end: 441,
  },
  ...["/writing", "/projects", "/people"].map((path) => ({
    path,
    title: "#page-heading",
    letters: "#page-heading",
    text: "#page-heading + p",
    end: 776,
  })),
];

for (const { path, title, end } of pages)
  for (const width of [320, 1280]) {
    test(`on ${path} the base line runs from rail to rail in the rails' colour at ${width}px`, async ({
      page,
    }) => {
      const spectra = await stubRecord(page);
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      await expect(waves(page)).toHaveAttribute("aria-hidden", "true");
      const [box, panel, heading] = await Promise.all([
        line(page).boundingBox(),
        waves(page)
          .locator("xpath=ancestor::*[@data-slot='panel'][1]")
          .boundingBox(),
        page.locator(title).boundingBox(),
      ]);
      if (!box || !panel || !heading) throw new Error("Missing heading");
      expect(box.x).toBeCloseTo(panel.x, 1);
      expect(box.width).toBeCloseTo(panel.width, 1);
      expect(box.height).toBe(1);
      // It rests on whole pixels, as crisp as the rails, above the title.
      expect(box.y).toBeCloseTo(Math.round(box.y), 2);
      expect(box.y + box.height).toBeLessThan(heading.y);
      const [lineColour, railColour] = await line(page).evaluate((node) => {
        const rails = document.querySelector('[data-slot="blueprint-rail"]');
        if (!rails) throw new Error("Missing rails");
        return [
          getComputedStyle(node).backgroundColor,
          getComputedStyle(rails, "::after").borderLeftColor,
        ];
      });
      expect(lineColour).toBe(railColour);

      // In silence a low ripple gathers over the title and ends within the page.
      await expectRest(page);
      expect((await drawn(page)).right).toBeLessThanOrEqual(
        Math.min(panel.width, end + 1),
      );
      // Nothing is downloaded for the waves until a record plays.
      expect(spectra).toEqual([]);
    });
  }

for (const { path, letters, text } of pages)
  for (const width of [390, 1280]) {
    test(`on ${path} the base line sits as far above the title as the text sits below it at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(path);
      const gaps = await page.evaluate(
        async ({ letters, text }) => {
          await document.fonts.ready;
          const context = document.createElement("canvas").getContext("2d");
          const base = document.querySelector("[data-sound-line]");
          const below = document.querySelector(text);
          if (!context || !base || !below) throw new Error("Missing heading");
          /** The first line's baseline, and the top of the tallest glyph on it. */
          const measure = (element: Element) => {
            // An empty inline block rests its bottom edge on the baseline.
            const probe = document.createElement("span");
            probe.style.display = "inline-block";
            element.prepend(probe);
            const baseline = probe.getBoundingClientRect().bottom;
            probe.remove();
            const style = getComputedStyle(element);
            context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            const rise = context.measureText(
              element.textContent ?? "",
            ).actualBoundingBoxAscent;
            return { baseline, top: baseline - rise };
          };
          const title = Array.from(document.querySelectorAll(letters), measure);
          const baseline = Math.max(...title.map((part) => part.baseline));
          return {
            above:
              Math.min(...title.map((part) => part.top)) -
              base.getBoundingClientRect().bottom,
            below: measure(below).top - baseline,
          };
        },
        { letters, text },
      );
      expect(gaps.above).toBeGreaterThan(20);
      // Linux reports text heights in whole pixels, so allow a pixel of rounding.
      expect(Math.abs(gaps.above - gaps.below)).toBeLessThan(2);
    });
  }

for (const [width, size] of [
  [390, "36px"],
  [1280, "48px"],
] as const) {
  test(`index titles are the size of the homepage wordmark at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/");
    await expect(page.locator("#hero-heading")).toHaveCSS("font-size", size);
    for (const path of ["/writing", "/projects", "/people"]) {
      await page.goto(path);
      await expect(page.locator("#page-heading")).toHaveCSS("font-size", size);
    }
    // Pages without waves keep the larger title.
    await page.goto("/privacy");
    await expect(waves(page)).toHaveCount(0);
    await expect(page.locator("#page-heading")).not.toHaveCSS(
      "font-size",
      size,
    );
  });
}

test("strummed strings swell the waves until the guitar is muted", async ({
  page,
}) => {
  await page.goto("/");
  await guitar(page).getByRole("button", { name: "Enable sound" }).click();
  await expect(guitar(page)).toHaveAttribute("data-audio-state", "ready");
  await expectRest(page);
  await expect
    .poll(async () => {
      for (const string of [5, 3, 1])
        await guitar(page)
          .locator(`[data-guitar-string="${string}"]`)
          .press("Enter");
      return reach(page);
    })
    .toBeGreaterThan(8);
  await guitar(page).getByRole("button", { name: "Mute sound" }).click();
  await expectRest(page);
});

test("the record swells the waves on every page it plays across", async ({
  page,
}) => {
  const spectra = await stubRecord(page);
  await page.goto("/");
  await play(page);
  await expect.poll(() => reach(page)).toBeGreaterThan(15);
  expect(spectra).toHaveLength(1);

  await arm(page).press("Enter");
  await expect(record(page)).toHaveAttribute("data-audio-state", "paused");
  await expectRest(page);

  await play(page);
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Writings" })
    .click();
  await expect(page).toHaveURL(/\/writing$/);
  // The record keeps playing, and this page's own waves pick it up.
  await expect.poll(() => reach(page)).toBeGreaterThan(11);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(record(page)).toHaveAttribute("data-audio-state", "playing");
  await page.evaluate(() => scrollTo(0, 0));
  await expect.poll(() => reach(page)).toBeGreaterThan(15);
});

test("reduced motion keeps the base line and draws no waves", async ({
  page,
}) => {
  const spectra = await stubRecord(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(line(page)).toBeVisible();
  await play(page);
  await expect.poll(() => spectra.length).toBe(1);
  await expect
    .poll(() =>
      record(page)
        .locator("audio")
        .evaluate((node: HTMLAudioElement) => node.currentTime),
    )
    .toBeGreaterThan(0.5);
  expect(await reach(page)).toBe(0);
});
