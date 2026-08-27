import { existsSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("development lab is absent from the production build", async ({
  page,
}) => {
  expect(existsSync("dist/lab")).toBe(false);

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
  const accessibility = await new AxeBuilder({ page }).analyze();

  expect({
    status: response?.status(),
    title: await page.title(),
    heading: await page.getByRole("heading", { level: 1 }).textContent(),
    mainLandmarks: await page.getByRole("main").count(),
    panels: await page.locator('[data-slot="panel"]').count(),
    ruleBands: await page.locator('[data-slot="panel-rule-band"]').count(),
    edgeOverrides: await page
      .locator(".screen-line-top-none, .screen-line-bottom-none")
      .count(),
    islands: await page.locator("astro-island").count(),
    themeScripts: await page.locator("script").count(),
    runtimeErrors,
    accessibilityViolations: accessibility.violations.map(({ id }) => id),
  }).toEqual({
    status: 200,
    title: "Sky Lu",
    heading: "Sky Lu",
    mainLandmarks: 1,
    panels: 2,
    ruleBands: 3,
    edgeOverrides: 0,
    islands: 0,
    themeScripts: 2,
    runtimeErrors: [],
    accessibilityViolations: [],
  });
});

for (const theme of ["light", "dark"] as const) {
  test(`first visit follows the ${theme} system theme before styles load`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme });
    const response = await page.goto("/");
    const html = (await response?.text()) ?? "";
    const expected = themeExpectation(theme);

    expect(html.indexOf("<script>")).toBeGreaterThan(
      html.indexOf('name="theme-color"'),
    );
    expect(html.indexOf("<script>")).toBeLessThan(
      html.indexOf('rel="stylesheet"'),
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("button", { name: expected.toggleLabel }),
    ).toBeVisible();
    await expect(
      page.locator(`[data-theme-icon="${expected.nextTheme}"]`),
    ).toBeVisible();
    await expect(page.locator(`[data-theme-icon="${theme}"]`)).toBeHidden();
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

  const toggle = page.locator("[data-theme-toggle]");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");
  await toggle.focus();
  await page.keyboard.press("Enter");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(
    page.getByRole("button", { name: "Switch to light theme" }),
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

test("system theme changes remain live until the visitor chooses", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await readThemeState(page)).toEqual(themeExpectation("dark").state);
});

test("theme control stays unboxed and fills only over the icon", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const toggle = page.locator("[data-theme-toggle]");
  await expect(toggle).toHaveAccessibleName("Switch to dark theme");
  const moonFill = page
    .locator('[data-theme-icon="dark"] [data-theme-icon-fill]')
    .first();
  const moonIcon = page.locator('[data-theme-icon="dark"]');

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
    .locator('[data-theme-icon="light"] [data-theme-icon-fill]')
    .first();
  await page.locator('[data-theme-icon="light"]').hover();
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
      headerText: header.textContent?.trim() ?? "",
    };
  });

  expect(shell.position).toBe("sticky");
  expect(shell.header.height).toBe(52);
  expect(shell.headerRail.left).toBeCloseTo(shell.pageRail.left, 3);
  expect(shell.headerRail.right).toBeCloseTo(shell.pageRail.right, 3);
  expect(shell.firstPanel.top).toBeCloseTo(shell.header.bottom, 3);
  expect(shell.toggle.right).toBeLessThan(shell.headerRail.right);
  expect(shell.headerBottomRule).toBe('""');
  expect(shell.firstPanelTopRule).toBe("none");
  expect(shell.headerText).toBe("");
  await expect(page.locator('[data-slot="site-header"] a')).toHaveCount(0);

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
        '#hero-panel > [data-slot="panel-header"]',
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
        heroHeader: rect('#hero-panel > [data-slot="panel-header"]'),
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
    expect(geometry.headerRail.left).toBeCloseTo(geometry.rail.left, 3);
    expect(geometry.headerRail.right).toBeCloseTo(geometry.rail.right, 3);
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

test("integration title uses the compact blueprint header composition", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");

  const composition = await page.evaluate(() => {
    const stripe = document.querySelector<HTMLElement>(
      '[data-slot="stripe-separator"]',
    );
    const panel = document.querySelector<HTMLElement>("#integration-panel");
    const header = panel?.querySelector<HTMLElement>(
      ':scope > [data-slot="panel-header"]',
    );
    const title = panel?.querySelector<HTMLElement>(
      '[data-slot="panel-title"]',
    );
    if (!stripe || !panel || !header || !title) {
      throw new Error("Missing integration title composition");
    }

    const stripeBounds = stripe.getBoundingClientRect();
    const panelBounds = panel.getBoundingClientRect();
    const headerBounds = header.getBoundingClientRect();
    const titleBounds = title.getBoundingClientRect();
    const headerStyle = getComputedStyle(header);

    return {
      titleParent: title.parentElement?.dataset.slot,
      firstPanelChild: panel.firstElementChild?.getAttribute("data-slot"),
      afterHeader: header.nextElementSibling?.getAttribute("data-slot"),
      joins: [
        panelBounds.top - stripeBounds.bottom,
        Number.parseFloat(headerStyle.paddingTop),
        titleBounds.left -
          headerBounds.left -
          Number.parseFloat(headerStyle.paddingLeft),
        headerBounds.bottom - titleBounds.bottom,
      ],
    };
  });

  expect(composition).toEqual({
    titleParent: "panel-header",
    firstPanelChild: "panel-header",
    afterHeader: "panel-rule-band",
    joins: [0, 0, 0, 0],
  });
});

test("panel sections share one responsive spacing rhythm", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");

  const rhythm = await page.evaluate(() => {
    const bounds = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) throw new Error(`Missing rhythm element: ${selector}`);
      return element.getBoundingClientRect();
    };
    const integrationHeaderElement = document.querySelector<HTMLElement>(
      "#integration-panel header",
    );
    const integrationBodyElement = document.querySelector<HTMLElement>(
      '#integration-panel [data-slot="panel-body"]',
    );
    if (!integrationHeaderElement || !integrationBodyElement) {
      throw new Error("Missing integration panel structure");
    }
    const integrationDescription = bounds(
      '#integration-panel [data-slot="panel-body"] > p',
    );
    const integrationBody = bounds(
      '#integration-panel [data-slot="panel-body"]',
    );
    const integrationGrid = bounds("#integration-panel figure > div");
    const integrationCaption = bounds("#integration-panel figcaption");
    const metadata = bounds("#integration-panel dl");
    const metadataItem = bounds("#integration-panel dl > div");

    return {
      sectionBlock: Number.parseFloat(
        getComputedStyle(integrationBodyElement).paddingBottom,
      ),
      inlineStarts: [
        bounds("#hero-heading").left,
        bounds('#hero-panel [data-slot="panel-body"] p').left,
        bounds("#integration-heading").left,
        integrationGrid.left,
        metadataItem.left,
      ],
      blockGaps: [
        integrationDescription.top - integrationBody.top,
        integrationGrid.top - integrationDescription.bottom,
        integrationBody.bottom - integrationCaption.bottom,
        metadataItem.top - metadata.top,
        metadata.bottom - metadataItem.bottom,
      ],
    };
  });

  expect(new Set(rhythm.inlineStarts).size).toBe(1);
  for (const gap of rhythm.blockGaps) {
    expect(gap).toBeCloseTo(rhythm.sectionBlock, 3);
  }
});

test("hero title is optically aligned with its eyebrow", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready.then(() => undefined));

  const alignment = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>("#hero-heading");
    const eyebrow = document.querySelector<HTMLElement>(
      '#hero-panel [data-slot="eyebrow"]',
    );
    if (!heading || !eyebrow) throw new Error("Missing hero typography");

    const style = getComputedStyle(heading);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas 2D context is unavailable");

    context.font = style.font;
    const firstCharacter = heading.textContent?.trim().charAt(0) ?? "";
    const glyph = context.measureText(firstCharacter);

    return {
      boxOffset:
        heading.getBoundingClientRect().left -
        eyebrow.getBoundingClientRect().left,
      inkOffset:
        heading.getBoundingClientRect().left +
        Number.parseFloat(style.textIndent) -
        glyph.actualBoundingBoxLeft -
        eyebrow.getBoundingClientRect().left,
      marginInlineStart: Number.parseFloat(style.marginInlineStart),
      textIndent: Number.parseFloat(style.textIndent),
    };
  });

  expect(alignment.boxOffset).toBeCloseTo(0, 3);
  expect(alignment.marginInlineStart).toBe(0);
  expect(Math.abs(alignment.inkOffset)).toBeLessThanOrEqual(1);
});

test("rule bands own both edges at direct panel boundaries", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");

  const boundaries = await page.evaluate(() => {
    const rect = (element: Element | null, label: string) => {
      if (!element) throw new Error(`Missing boundary element: ${label}`);
      return element.getBoundingClientRect();
    };
    const panel = document.querySelector("#integration-panel");
    const bands = panel?.querySelectorAll('[data-slot="panel-rule-band"]');
    const heroBands = document.querySelectorAll(
      '#hero-panel > [data-slot="panel-rule-band"]',
    );
    if (!panel || !bands || bands.length !== 2 || heroBands.length !== 1) {
      throw new Error("Missing direct panel rule bands");
    }

    const header = rect(panel.querySelector("header"), "header");
    const body = rect(panel.querySelector('[data-slot="panel-body"]'), "body");
    const metadata = rect(panel.querySelector("dl"), "metadata");
    const titleBand = rect(bands[0], "title band");
    const endBand = rect(bands[1], "end band");
    const panelBounds = rect(panel, "panel");
    const titleBandElement = bands[0];
    const directBandElement = heroBands[0];
    const before = getComputedStyle(titleBandElement, "::before");
    const after = getComputedStyle(titleBandElement, "::after");
    const directBefore = getComputedStyle(directBandElement, "::before");
    const directAfter = getComputedStyle(directBandElement, "::after");

    return {
      bandHeights: [titleBand.height, endBand.height],
      titleBandRules: {
        before: before.content,
        after: after.content,
      },
      directBandRules: {
        before: directBefore.content,
        after: directAfter.content,
      },
      joins: [
        titleBand.top - header.bottom,
        body.top - titleBand.bottom,
        endBand.top - metadata.bottom,
        panelBounds.bottom - endBand.bottom,
      ],
      titleBandWidth: titleBand.width,
      headerWidth: header.width,
    };
  });

  expect(boundaries.bandHeights).toEqual([16, 16]);
  expect(boundaries.titleBandRules).toEqual({ before: '""', after: '""' });
  expect(boundaries.directBandRules).toEqual({ before: '""', after: '""' });
  expect(boundaries.joins).toEqual([0, 0, 0, 0]);
  expect(boundaries.titleBandWidth).toBeCloseTo(boundaries.headerWidth, 3);
});

test("each physical screen rule has one visible paint owner", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/");

  const overlappingRules = await page.evaluate(() => {
    const painters = [
      ...document.querySelectorAll<HTMLElement>("main, main *"),
    ].flatMap((element) => {
      const bounds = element.getBoundingClientRect();

      return (["::before", "::after"] as const).flatMap((pseudo) => {
        const style = getComputedStyle(element, pseudo);
        const height = Number.parseFloat(style.height);
        if (
          style.content === "none" ||
          style.display === "none" ||
          style.position !== "absolute" ||
          height !== 1
        ) {
          return [];
        }

        const inset = Number.parseFloat(
          pseudo === "::before" ? style.top : style.bottom,
        );
        const y =
          pseudo === "::before"
            ? bounds.top + inset
            : bounds.bottom - inset - height;

        return [
          {
            owner:
              element.id ||
              element.dataset.slot ||
              element.tagName.toLowerCase(),
            pseudo,
            y: Math.round(y * 1000) / 1000,
          },
        ];
      });
    });

    return Object.values(Object.groupBy(painters, ({ y }) => y)).filter(
      (owners): owners is typeof painters =>
        owners !== undefined && owners.length > 1,
    );
  });

  expect(overlappingRules).toEqual([]);
});

test("homepage serves both visual themes and local typography", async ({
  page,
}) => {
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
      (path) => path.startsWith("/fonts/") || path.startsWith("/_astro/geist-"),
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
  test.use({ colorScheme: "dark", javaScriptEnabled: false });

  test("content remains available and CSS follows the dark system theme", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sky Lu");
    await expect(page.locator("[data-theme-toggle]")).toBeHidden();
    await expect(page.locator("html")).not.toHaveAttribute("data-theme", /.+/);
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
