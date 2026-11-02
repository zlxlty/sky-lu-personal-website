import { expect, test, type Page } from "@playwright/test";
import { silentWav } from "../support/audio";

const player = (page: Page) => page.locator("local-record");
const audio = (page: Page) => player(page).locator("audio");
const arm = (page: Page) =>
  player(page).getByRole("slider", { name: "Tonearm position" });

async function open(page: Page) {
  await page.route("https://audio.example.com/**", (route) => {
    const bytes = silentWav();
    const range = route
      .request()
      .headers()
      .range?.match(/^bytes=(\d+)-(\d*)$/);
    const start = Number(range?.[1] ?? 0);
    const end = range?.[2]
      ? Math.min(Number(range[2]), bytes.length - 1)
      : bytes.length - 1;
    return route.fulfill({
      status: range ? 206 : 200,
      contentType: "audio/wav",
      headers: {
        "Accept-Ranges": "bytes",
        ...(range
          ? { "Content-Range": `bytes ${start}-${end}/${bytes.length}` }
          : {}),
      },
      body: bytes.subarray(start, end + 1),
    });
  });
  await page.goto("/");
  await player(page).evaluate((node) =>
    node.setAttribute("data-src", "https://audio.example.com/cover.wav"),
  );
  await player(page).scrollIntoViewIfNeeded();
}

test("nearby player preconnects; focus prepares only the selected recording without playing", async ({
  page,
}) => {
  const requested: string[] = [];
  page.on("request", (request) => {
    if (request.url().startsWith("https://audio.example.com/"))
      requested.push(request.url());
  });
  await open(page);
  await expect(
    page.locator('link[rel="preconnect"][href="https://audio.example.com"]'),
  ).toHaveCount(1);
  await expect(audio(page)).not.toHaveAttribute("src");
  expect(requested).toEqual([]);
  await arm(page).focus();
  await expect.poll(() => requested.length).toBeGreaterThan(0);
  expect(new Set(requested)).toEqual(
    new Set(["https://audio.example.com/cover.wav"]),
  );
  expect(
    await audio(page).evaluate((node: HTMLAudioElement) => node.paused),
  ).toBe(true);
  await expect(player(page).locator("turntable-control")).not.toHaveAttribute(
    "playing",
  );
});

test("waiting reports buffering without pausing or reloading the media", async ({
  page,
}) => {
  await open(page);
  await arm(page).press("Enter");
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await audio(page).evaluate((node) =>
    node.dispatchEvent(new Event("waiting")),
  );
  await expect(player(page)).toHaveAttribute("data-audio-state", "buffering");
  await expect(player(page).locator("[data-audio-status]")).toHaveText(
    "Buffering…",
  );
  await expect(player(page).locator("[data-audio-status]")).toHaveClass(
    "sr-only",
  );
  expect(
    await audio(page).evaluate((node: HTMLAudioElement) => node.paused),
  ).toBe(false);
  await audio(page).evaluate((node) =>
    node.dispatchEvent(new Event("playing")),
  );
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await arm(page).press("Home");
  await audio(page).evaluate((node) =>
    node.dispatchEvent(new Event("waiting")),
  );
  await expect(player(page)).toHaveAttribute("data-audio-state", "paused");
});

async function networkError(page: Page) {
  return audio(page).evaluate((node: HTMLAudioElement) => {
    Object.defineProperty(node, "error", {
      configurable: true,
      value: { code: MediaError.MEDIA_ERR_NETWORK },
    });
    node.dispatchEvent(new Event("error"));
    return node.currentTime;
  });
}

test("network recovery reloads at the same position, then stops after two retries", async ({
  page,
}) => {
  await open(page);
  await arm(page).press("Enter");
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await audio(page).evaluate((node: HTMLAudioElement) => {
    node.currentTime = 1;
    // The player's metadata handler restores currentTime before this listener.
    node.addEventListener("loadedmetadata", () => {
      node.dataset.restoredTime = String(node.currentTime);
    });
    const load = node.load.bind(node);
    node.load = () => {
      delete node.dataset.restoredTime;
      node.dataset.loads = String(Number(node.dataset.loads ?? 0) + 1);
      load();
    };
  });
  await page.clock.install();
  for (const [attempt, delay] of [
    [1, 1100],
    [2, 3100],
  ] as const) {
    const resumeAt = await networkError(page);
    await expect(player(page)).toHaveAttribute("data-audio-state", "buffering");
    await page.clock.runFor(delay);
    await expect(audio(page)).toHaveAttribute("data-loads", String(attempt));
    await expect(audio(page)).toHaveAttribute("data-restored-time");
    expect(
      Number(await audio(page).getAttribute("data-restored-time")),
    ).toBeCloseTo(resumeAt, 1);
    // Linux WebKit can emit waiting after a seek while playback advances.
    // Verify restored position and real playback, rather than event ordering.
    await expect
      .poll(() =>
        audio(page).evaluate((node: HTMLAudioElement) =>
          node.paused || node.seeking ? 0 : node.currentTime,
        ),
      )
      .toBeGreaterThan(resumeAt + 0.1);
  }
  await networkError(page);
  await expect(player(page)).toHaveAttribute("data-audio-state", "error");
  await page.clock.runFor(5000);
  await expect(audio(page)).toHaveAttribute("data-loads", "2");
  await expect(player(page).locator("[data-audio-error]")).toBeVisible();
});

test("decode errors do not retry automatically, but a fresh gesture can reload", async ({
  page,
}) => {
  await open(page);
  await arm(page).press("Enter");
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await page.clock.install();
  await audio(page).evaluate((node: HTMLAudioElement) => {
    const load = node.load.bind(node);
    node.load = () => {
      node.dataset.reloaded = "true";
      load();
    };
    Object.defineProperty(node, "error", {
      configurable: true,
      value: { code: MediaError.MEDIA_ERR_DECODE },
    });
    node.dispatchEvent(new Event("error"));
  });
  await expect(player(page)).toHaveAttribute("data-audio-state", "error");
  await page.clock.runFor(5000);
  await expect(audio(page)).not.toHaveAttribute("data-reloaded");
  await arm(page).press("Home");
  await arm(page).press("Enter");
  await expect(audio(page)).toHaveAttribute("data-reloaded", "true");
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await expect(player(page).locator("[data-audio-error]")).toBeHidden();
});

const writingLink = (page: Page) =>
  page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Writings", exact: true });
const position = (page: Page) =>
  audio(page).evaluate((node: HTMLAudioElement) => node.currentTime);

async function startAndMark(page: Page) {
  await open(page);
  await arm(page).press("Enter");
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await audio(page).evaluate((node: HTMLAudioElement) => {
    node.dataset.kept = "true";
    node.addEventListener("pause", () => {
      node.dataset.pausedOnce = "true";
    });
  });
}

async function expectUninterrupted(page: Page, angle: string | null) {
  await expect(audio(page)).toHaveAttribute("data-kept", "true");
  await expect(audio(page)).not.toHaveAttribute("data-paused-once");
  await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
  await expect(arm(page)).toHaveAttribute("aria-valuenow", angle ?? "");
  const before = await position(page);
  await expect.poll(() => position(page)).toBeGreaterThan(before);
  await player(page).scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      player(page)
        .locator("[data-turntable-disc]")
        .evaluate((node) =>
          node
            .getAnimations()
            .some((animation) => animation.playState === "running"),
        ),
    )
    .toBe(true);
}

test("the recording keeps playing across links, Back, and Forward", async ({
  page,
}) => {
  await startAndMark(page);
  const angle = await arm(page).getAttribute("aria-valuenow");
  await writingLink(page).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expectUninterrupted(page, angle);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expectUninterrupted(page, angle);
  await page.goForward();
  await expect(page).toHaveURL(/\/writing$/);
  await expectUninterrupted(page, angle);
});

test("the recording keeps playing where the browser has no moveBefore", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(Element.prototype, "moveBefore");
  });
  await startAndMark(page);
  const angle = await arm(page).getAttribute("aria-valuenow");
  await writingLink(page).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expectUninterrupted(page, angle);
});

test("the selected record survives a page change", async ({ page }) => {
  await open(page);
  const active = player(page).locator("[data-record-track][data-active]");
  const first = await active.textContent();
  await player(page)
    .getByRole("button", { name: "Change record" })
    .press("ArrowUp");
  await expect(active).not.toHaveText(first ?? "");
  const chosen = await active.textContent();
  await writingLink(page).click();
  await expect(page).toHaveURL(/\/writing$/);
  await expect(active).toHaveText(chosen ?? "");
});

test("a pending network retry carries on after a page change", async ({
  page,
}) => {
  await startAndMark(page);
  await page.clock.install();
  await audio(page).evaluate((node: HTMLAudioElement) => {
    node.load = () => {
      node.dataset.reloads = String(Number(node.dataset.reloads ?? 0) + 1);
    };
  });
  await networkError(page);
  await expect(player(page)).toHaveAttribute("data-audio-state", "buffering");
  await writingLink(page).click();
  await expect(page).toHaveURL(/\/writing$/);
  await page.clock.runFor(1100);
  await expect(audio(page)).toHaveAttribute("data-reloads", "1");
});

test("reloading the page still ends the recording", async ({ page }) => {
  await startAndMark(page);
  await page.reload();
  await expect(audio(page)).not.toHaveAttribute("src");
  await expect(audio(page)).not.toHaveAttribute("data-kept");
  await expect(player(page)).not.toHaveAttribute("data-audio-state");
  await expect(arm(page)).toHaveAttribute("aria-valuenow", "0");
});

for (const cancel of ["pause", "change", "remove"] as const) {
  test(`${cancel} cancels a pending network retry`, async ({ page }) => {
    await open(page);
    await arm(page).press("Enter");
    await expect(player(page)).toHaveAttribute("data-audio-state", "playing");
    await page.clock.install();
    await audio(page).evaluate((node: HTMLAudioElement) => {
      node.load = () => {
        document.body.dataset.reloads = String(
          Number(document.body.dataset.reloads ?? 0) + 1,
        );
      };
    });
    await networkError(page);
    if (cancel === "pause") await arm(page).press("Home");
    else
      await player(page).evaluate((node, action) => {
        if (action === "remove") node.remove();
        else
          node.setAttribute("data-src", "https://audio.example.com/next.wav");
      }, cancel);
    // Removal/source changes themselves call load() to release old resources.
    const count = await page.locator("body").getAttribute("data-reloads");
    await page.clock.runFor(5000);
    expect(await page.locator("body").getAttribute("data-reloads")).toBe(count);
  });
}
