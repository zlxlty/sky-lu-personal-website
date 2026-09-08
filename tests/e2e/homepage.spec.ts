import { existsSync, readdirSync } from "node:fs";
import { basename } from "node:path";
import quartertone from "../../src/assets/guitar/quartertone.json" with { type: "json" };
import { profile } from "../../src/data/profile";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { inspectBlueprintRules } from "../support/blueprint-rules";
import { storeTheme } from "../support/theme";

test("development lab is absent from the production build", async ({
  page,
  request,
}) => {
  expect(existsSync("dist/lab")).toBe(false);
  expect(
    readdirSync("dist/_astro").some((file) => file.includes("jazz-n-brass")),
  ).toBe(false);
  const files = readdirSync("dist/_astro");
  expect(
    files.filter((file) =>
      /GuitarAudition|guitar-samples|shiny|fss|iowa/i.test(file),
    ),
  ).toEqual([]);
  expect(
    files
      .filter((file) => /\.(mp3|wav)$/.test(file))
      .map((file) => file.split(".")[0])
      .sort(),
  ).toEqual(
    quartertone.samples.map((sample) => basename(sample.file, ".mp3")).sort(),
  );
  expect(quartertone.samples).toHaveLength(24);
  expect((await request.get("/lab/guitar")).status()).toBe(404);

  await page.goto("/lab");
  await expect(
    page.getByRole("heading", { level: 1, name: "Component lab" }),
  ).toHaveCount(0);
});

test("homepage satisfies the production smoke contract", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const response = await page.goto("/");
  await expect(page.locator("[data-guitar]")).toHaveAttribute("data-ready");
  const accessibility = await new AxeBuilder({ page })
    // Approved decorative contrast exception, documented in PLAN.md.
    .exclude('[data-slot="rail-annotation"]')
    .analyze();

  expect({
    status: response?.status(),
    title: await page.title(),
    heading: (
      await page.getByRole("heading", { level: 1 }).textContent()
    )?.trim(),
    mainLandmarks: await page.getByRole("main").count(),
    panels: await page.locator('[data-slot="panel"]').count(),
    ruleBands: await page.locator('[data-slot="panel-rule-band"]').count(),
    edgeOverrides: await page
      .locator(".screen-line-top-none, .screen-line-bottom-none")
      .count(),
    islands: await page.locator("astro-island").count(),
    runtimeErrors,
    accessibilityViolations: accessibility.violations.map(({ id }) => id),
  }).toEqual({
    status: 200,
    title: "Sky Lu",
    heading: "sky lu.",
    mainLandmarks: 1,
    panels: 13,
    ruleBands: 3,
    edgeOverrides: 0,
    islands: 1,
    runtimeErrors: [],
    accessibilityViolations: [],
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`hero name hint supports hover, focus, and dismissal in ${theme} mode`, async ({
    page,
  }) => {
    await storeTheme(page, theme);
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    const trigger = page.locator("[data-name-hint-trigger]");
    const tooltip = page.locator("#hero-name-hint");
    const heading = page.getByRole("heading", { level: 1 });
    await expect(trigger).not.toHaveAttribute("title");
    await expect(tooltip).toBeHidden();
    const headingBox = await heading.boundingBox();

    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText("Legal Name: Tianyi Lu");
    await expect(trigger).toHaveAccessibleDescription("Legal Name: Tianyi Lu");
    expect(await heading.boundingBox()).toEqual(headingBox);
    await tooltip.hover();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tooltip).toBeHidden();

    await page.mouse.move(0, 0);
    await trigger.focus();
    await expect(tooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(tooltip).toBeHidden();
    await page.keyboard.press("Tab");
    await trigger.hover();
    await expect(tooltip).toBeVisible();
    await page.mouse.move(0, 0);
    await expect(tooltip).toBeHidden();
  });

  test(`first visit is dark with a ${theme} system theme before styles load`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    const response = await page.goto("/");
    const html = (await response?.text()) ?? "";
    const expected = themeExpectation("dark");

    expect(html.indexOf("<script>")).toBeGreaterThan(
      html.indexOf('name="theme-color"'),
    );
    expect(html.indexOf("<script>")).toBeLessThan(
      html.indexOf('rel="stylesheet"'),
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(
      page
        .getByRole("banner")
        .getByRole("button", { name: expected.toggleLabel }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("banner")
        .locator(`[data-theme-icon="${expected.nextTheme}"]`),
    ).toBeVisible();
    await expect(
      page.getByRole("banner").locator('[data-theme-icon="dark"]'),
    ).toBeHidden();
    expect(await readThemeState(page)).toEqual(expected.state);
  });
}

test("explicit theme choice persists and overrides later system changes", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.addInitScript(() => {
    if (localStorage.getItem("theme") === null) {
      localStorage.setItem("theme", "light");
    }
  });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  const toggle = page.getByRole("banner").locator("[data-theme-toggle]");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");
  await toggle.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page
      .getByRole("banner")
      .getByRole("button", { name: "Switch to light theme" }),
  ).toBeFocused();
  await expect(page.locator("[data-theme-status]")).toHaveText(
    "Dark theme active.",
  );
  expect(await page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await readThemeState(page)).toEqual(themeExpectation("dark").state);
});

test("system theme changes do not override the dark default", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "dark" });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await readThemeState(page)).toEqual(themeExpectation("dark").state);
});

test("theme control stays unboxed and fills only over the icon", async ({
  page,
}) => {
  await storeTheme(page, "light");
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const toggle = page.getByRole("banner").locator("[data-theme-toggle]");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");
  const moonFill = page
    .getByRole("banner")
    .locator('[data-theme-icon="dark"] [data-theme-icon-fill]')
    .first();
  const moonIcon = page.getByRole("banner").locator('[data-theme-icon="dark"]');

  expect(
    await toggle.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        background: style.backgroundColor,
        borderWidth: style.borderTopWidth,
        boxShadow: style.boxShadow,
      };
    }),
  ).toEqual({
    background: "rgba(0, 0, 0, 0)",
    borderWidth: "0px",
    boxShadow: "none",
  });
  await expect(moonFill).toHaveCSS("opacity", "0");

  await toggle.hover({ position: { x: 1, y: 1 } });
  await expect(moonFill).toHaveCSS("opacity", "0");

  await moonIcon.hover();
  await expect(moonFill).toHaveCSS("opacity", "1");

  await toggle.click();
  const sunFill = page
    .getByRole("banner")
    .locator('[data-theme-icon="light"] [data-theme-icon-fill]')
    .first();
  await page.getByRole("banner").locator('[data-theme-icon="light"]').hover();
  await expect(sunFill).toHaveCSS("opacity", "1");
});

test("sticky header aligns to the blueprint rail and owns its boundary", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 320 });
  await page.goto("/");

  const shell = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(
      '[data-slot="site-header"]',
    );
    const headerRail = document.querySelector<HTMLElement>(
      '[data-slot="site-header-rail"]',
    );
    const pageRail = document.querySelector<HTMLElement>(
      '[data-slot="blueprint-rail"]',
    );
    const firstPanel = document.querySelector<HTMLElement>("#hero-panel");
    const toggle = document.querySelector<HTMLElement>("[data-theme-toggle]");
    if (!header || !headerRail || !pageRail || !firstPanel || !toggle) {
      throw new Error("Missing sticky shell elements");
    }

    const rect = (element: HTMLElement) => {
      const bounds = element.getBoundingClientRect();
      return {
        top: bounds.top,
        bottom: bounds.bottom,
        left: bounds.left,
        right: bounds.right,
        height: bounds.height,
      };
    };

    return {
      header: rect(header),
      headerRail: rect(headerRail),
      pageRail: rect(pageRail),
      firstPanel: rect(firstPanel),
      toggle: rect(toggle),
      position: getComputedStyle(header).position,
      headerBottomRule: getComputedStyle(headerRail, "::after").content,
      firstPanelTopRule: getComputedStyle(firstPanel, "::before").content,
    };
  });

  expect(shell.position).toBe("sticky");
  expect(shell.header.height).toBe(52);
  expect(shell.headerRail.left).toBeCloseTo(shell.pageRail.left + 1, 3);
  expect(shell.headerRail.right).toBeCloseTo(shell.pageRail.right - 1, 3);
  expect(shell.firstPanel.top).toBeCloseTo(shell.header.bottom, 3);
  expect(shell.toggle.right).toBeLessThan(shell.headerRail.right);
  expect(shell.headerBottomRule).toBe('""');
  expect(shell.firstPanelTopRule).toBe("none");
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Sky Lu — Home" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("navigation", { name: "Main navigation" }).getByRole("link"),
  ).toHaveCount(2);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect
    .poll(() =>
      page
        .locator('[data-slot="site-header"]')
        .evaluate((element) => element.getBoundingClientRect().top),
    )
    .toBeCloseTo(0, 3);
});

test("skip link reaches the main landmark with the keyboard", async ({
  page,
}) => {
  await page.goto("/");

  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await page.keyboard.press("Tab");
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();

  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  expect(new URL(page.url()).hash).toBe("#main-content");
});

for (const width of [360, 768, 1024, 1440]) {
  test(`layout remains centered without overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    const geometry = await page.evaluate(() => {
      const rect = (selector: string) => {
        const element = document.querySelector<HTMLElement>(selector);
        if (!element) throw new Error(`Missing layout element: ${selector}`);
        const bounds = element.getBoundingClientRect();
        return {
          left: bounds.left,
          right: document.documentElement.clientWidth - bounds.right,
          width: bounds.width,
        };
      };
      const heroHeader = document.querySelector<HTMLElement>(
        '#hero-panel [data-slot="panel-body"]',
      );
      const themeToggle = document.querySelector<HTMLElement>(
        "[data-theme-toggle]",
      );
      if (!heroHeader || !themeToggle) {
        throw new Error("Missing hero header or theme control");
      }

      return {
        viewport: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        rail: rect('[data-slot="blueprint-rail"]'),
        heroHeader: rect('#hero-panel [data-slot="panel-body"]'),
        heroHeaderPaddingLeft: Number.parseFloat(
          getComputedStyle(heroHeader).paddingLeft,
        ),
        heroHeading: rect("#hero-heading"),
        figure: rect("figure"),
        headerRail: rect('[data-slot="site-header-rail"]'),
        themeToggle: rect("[data-theme-toggle]"),
      };
    });

    expect(geometry.scrollWidth).toBe(geometry.viewport);
    expect(Math.abs(geometry.rail.left - geometry.rail.right)).toBeLessThan(1);
    // Header content sits inside the frame's shared one-pixel rails.
    expect(geometry.headerRail.left).toBeCloseTo(geometry.rail.left + 1, 3);
    expect(geometry.headerRail.right).toBeCloseTo(geometry.rail.right + 1, 3);
    expect(geometry.figure.left).toBeGreaterThanOrEqual(geometry.rail.left);
    expect(geometry.figure.right).toBeGreaterThanOrEqual(geometry.rail.right);
    expect(geometry.themeToggle.left).toBeGreaterThanOrEqual(0);
    expect(geometry.themeToggle.right).toBeGreaterThanOrEqual(
      geometry.rail.right,
    );
    expect(geometry.heroHeading.left).toBeCloseTo(
      geometry.heroHeader.left + geometry.heroHeaderPaddingLeft,
      3,
    );
  });
}

test("hero text shares its left inset", async ({ page }) => {
  await page.goto("/");
  const starts = await page
    .locator("[data-hero-copy] > *")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().left),
    );
  expect(starts).toHaveLength(3);
  expect(new Set(starts).size).toBe(1);
});

test("the hero's stripe and rule band join flush with the next section", async ({
  page,
}) => {
  await page.goto("/");
  const boundaries = await page.evaluate(() => {
    const hero = document.querySelector("#hero-panel");
    const stripe = hero?.nextElementSibling;
    const band = stripe?.nextElementSibling;
    const next = band?.nextElementSibling;
    if (!hero || !stripe || !band || !next)
      throw new Error("Missing hero boundary");
    const h = hero.getBoundingClientRect();
    const s = stripe.getBoundingClientRect();
    const b = band.getBoundingClientRect();
    const n = next.getBoundingClientRect();
    return {
      stripe: stripe.getAttribute("data-slot"),
      band: band.getAttribute("data-slot"),
      height: b.height,
      width: b.width,
      heroWidth: h.width,
      joins: [s.top - h.bottom, b.top - s.bottom, n.top - b.bottom],
    };
  });
  expect(boundaries.stripe).toBe("stripe-separator");
  expect(boundaries.band).toBe("panel-rule-band");
  expect(boundaries.height).toBe(16);
  expect(boundaries.width).toBeCloseTo(boundaries.heroWidth, 3);
  expect(boundaries.joins).toEqual([0, 0, 0]);
});

test("each physical screen rule has one visible paint owner", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");

  const report = await inspectBlueprintRules(
    page,
    // Only stack boundaries own rules; the hero's inner grid is one section.
    'main > [data-slot="panel"], main > [data-slot="panel-rule-band"], main > [data-slot="stripe-separator"]',
  );
  expect(report.length).toBeGreaterThan(2);
  expect(
    report.filter(({ owners }) => owners.length !== 1 || !owners[0]?.fullWidth),
  ).toEqual([]);
});

test("homepage serves both visual themes and local typography", async ({
  page,
}) => {
  await storeTheme(page, "light");
  const fontResponses = new Map<string, number>();
  const fontOrigins = new Set<string>();
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (url.pathname.endsWith(".woff2")) {
      fontResponses.set(url.pathname, response.status());
      fontOrigins.add(url.origin);
    }
  });

  await page.goto("/");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  const light = await readTheme(page);
  await page.evaluate(() => {
    document.documentElement.dataset.theme = "dark";
  });
  const dark = await readTheme(page);

  expect(light).toEqual({
    background: "rgb(252, 243, 230)",
    color: "rgb(56, 51, 47)",
    headingLoaded: true,
    headingUsesGeist: true,
    sansLoaded: true,
    monoLoaded: true,
  });
  expect(dark).toEqual({
    background: "rgb(43, 39, 36)",
    color: "rgb(174, 152, 119)",
    headingLoaded: true,
    headingUsesGeist: true,
    sansLoaded: true,
    monoLoaded: true,
  });
  expect(Object.fromEntries(fontResponses)).toMatchObject({
    "/fonts/ibm-plex-mono-latin.woff2": 200,
    "/fonts/ibm-plex-sans-latin.woff2": 200,
  });
  expect(
    [...fontResponses].some(
      ([path, status]) =>
        /\/_astro\/geist-latin-wght-normal\.[\w-]+\.woff2$/.test(path) &&
        status === 200,
    ),
  ).toBe(true);
  expect(
    [...fontResponses.keys()].every(
      (path) =>
        path.startsWith("/fonts/") ||
        path.startsWith("/_astro/geist-") ||
        path.startsWith("/_astro/caveat-"),
    ),
  ).toBe(true);
  expect(
    [...fontResponses].some(
      ([path, status]) =>
        /\/_astro\/caveat-latin-wght-normal\.[\w-]+\.woff2$/.test(path) &&
        status === 200,
    ),
  ).toBe(true);
  expect([...fontOrigins]).toEqual([new URL(page.url()).origin]);
});

async function readTheme(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const heading = document.querySelector<HTMLElement>("#hero-heading");
    if (!heading) throw new Error("Missing hero heading");

    return {
      background: root.backgroundColor,
      color: root.color,
      headingLoaded: document.fonts.check('16px "Geist Variable"'),
      headingUsesGeist:
        getComputedStyle(heading).fontFamily.includes("Geist Variable"),
      sansLoaded: document.fonts.check('16px "IBM Plex Sans"'),
      monoLoaded: document.fonts.check('16px "IBM Plex Mono"'),
    };
  });
}

async function readThemeState(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const themeColor = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );

    return {
      theme: root.dataset.theme,
      colorScheme: getComputedStyle(root).colorScheme,
      background: getComputedStyle(root).backgroundColor,
      themeColor: themeColor?.content,
    };
  });
}

function themeExpectation(theme: "light" | "dark") {
  return theme === "dark"
    ? {
        nextTheme: "light" as const,
        toggleLabel: "Switch to light theme",
        state: {
          theme: "dark",
          colorScheme: "dark",
          background: "rgb(43, 39, 36)",
          themeColor: "#2b2724",
        },
      }
    : {
        nextTheme: "dark" as const,
        toggleLabel: "Switch to dark theme",
        state: {
          theme: "light",
          colorScheme: "light",
          background: "rgb(252, 243, 230)",
          themeColor: "#fcf3e6",
        },
      };
}

test.describe("without JavaScript", () => {
  test.use({ colorScheme: "light", javaScriptEnabled: false });

  test("content remains available in dark despite a light system theme", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("sky lu.");
    await expect(page.locator("[data-hero-copy]")).toContainText(
      profile.introduction,
    );
    await expect(page.locator("[data-name-hint-trigger]")).toHaveAttribute(
      "title",
      "Legal Name: Tianyi Lu",
    );
    await expect(
      page.getByRole("banner").getByRole("link", { name: "Sky Lu — Home" }),
    ).toHaveCount(0);
    await expect(page.locator("[data-guitar]")).toBeVisible();
    await expect(
      page.locator('[data-guitar-string][aria-disabled="true"]'),
    ).toHaveCount(6);
    await expect(
      page.getByRole("banner").locator("[data-theme-toggle]"),
    ).toBeHidden();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    expect(
      await page.locator("html").evaluate((root) => ({
        colorScheme: getComputedStyle(root).colorScheme,
        background: getComputedStyle(root).backgroundColor,
      })),
    ).toEqual({
      colorScheme: "dark",
      background: "rgb(43, 39, 36)",
    });
  });
});
