import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const waitForLabControls = async (page: Page) => {
  await page.addStyleTag({
    content: "astro-dev-toolbar { display: none !important; }",
  });
  const controls = page.locator('[data-slot="lab-controls"]');
  await expect(controls).toHaveAttribute("data-hydrated", "true");
  return controls;
};

for (const theme of ["light", "dark"] as const) {
  test(`lab exposes the real design system without ${theme}-theme accessibility errors`, async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme);

    const response = await page.goto("/lab");
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Component lab",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      "noindex,nofollow",
    );
    await expect(page.locator("astro-island")).toHaveCount(1);
    await expect(await waitForLabControls(page)).toBeVisible();

    const accessibility = await new AxeBuilder({ page })
      .exclude("astro-dev-toolbar")
      .analyze();

    expect(response?.status()).toBe(200);
    expect(runtimeErrors).toEqual([]);
    expect(accessibility.violations).toEqual([]);
  });
}

test("interactive specimens support keyboard and pointer review", async ({
  page,
}) => {
  await page.goto("/lab");
  await waitForLabControls(page);

  const disclosure = page.getByRole("button", {
    name: "Network research details",
  });
  await expect(disclosure).toHaveAttribute("aria-expanded", "true");
  await disclosure.click();
  await expect(disclosure).toHaveAttribute("aria-expanded", "false");

  const tooltipTrigger = page.getByRole("button", {
    name: "Research publication status",
  });
  await tooltipTrigger.hover();
  await expect(page.getByText("Public preprint available")).toBeVisible();

  const dialogTrigger = page.getByRole("button", { name: "Open dialog" });
  await dialogTrigger.click();
  await expect(
    page.getByRole("dialog", { name: "Research note" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialogTrigger).toBeFocused();

  const sheetTrigger = page.getByRole("button", { name: "Open sheet" });
  await sheetTrigger.click();
  await expect(
    page.getByRole("dialog", { name: "Navigation specimen" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheetTrigger).toBeFocused();

  const inlineCommand = page.getByRole("combobox", {
    name: "Filter lab destinations",
  });
  await inlineCommand.fill("jazz");
  await expect(page.getByRole("option", { name: "Jazz J" })).toBeVisible();
  await expect(page.getByRole("option", { name: "Writing W" })).toHaveCount(0);

  await page.getByRole("button", { name: "Open command dialog" }).click();
  const commandDialog = page.getByRole("dialog", {
    name: "Navigate the component lab",
  });
  await expect(commandDialog).toBeVisible();
  await commandDialog
    .getByRole("combobox", { name: "Navigate the component lab" })
    .fill("projects");
  await commandDialog.getByRole("option", { name: "Projects P" }).click();
  await expect(commandDialog).toHaveCount(0);
});

test("page-level stripe separators share adjacent panel boundaries", async ({
  page,
}) => {
  await page.goto("/lab");

  const separator = page.locator(
    '#lab-introduction + [data-slot="stripe-separator"]',
  );
  await expect(separator).toBeVisible();

  const boundary = await separator.evaluate((element) => {
    const previousPanel = element.previousElementSibling;
    const nextPanel = element.nextElementSibling;
    const rail = element.parentElement;
    const pattern = element.querySelector<HTMLElement>(
      '[data-slot="stripe-pattern"]',
    );
    if (!previousPanel || !nextPanel || !rail || !pattern) {
      throw new Error("Missing page-level stripe boundary");
    }

    const separatorStyle = getComputedStyle(element);
    const patternStyle = getComputedStyle(pattern);
    const previousPanelStyle = getComputedStyle(previousPanel);
    const railBefore = getComputedStyle(rail, "::before");
    const railAfter = getComputedStyle(rail, "::after");

    return {
      previousPanelRule: getComputedStyle(previousPanel, "::after").content,
      stripe: {
        top: patternStyle.borderTopWidth,
        right: patternStyle.borderRightWidth,
        bottom: patternStyle.borderBottomWidth,
        left: patternStyle.borderLeftWidth,
      },
      separatorRails: {
        right: separatorStyle.borderRightWidth,
        left: separatorStyle.borderLeftWidth,
      },
      panelRails: {
        right: previousPanelStyle.borderRightWidth,
        left: previousPanelStyle.borderLeftWidth,
        rightColor: previousPanelStyle.borderRightColor,
        leftColor: previousPanelStyle.borderLeftColor,
      },
      railOverlay: {
        beforeContent: railBefore.content,
        beforeWidth: railBefore.width,
        beforeZIndex: railBefore.zIndex,
        afterContent: railAfter.content,
        afterWidth: railAfter.width,
        afterZIndex: railAfter.zIndex,
      },
      nextPanelRule: getComputedStyle(nextPanel, "::before").content,
    };
  });

  expect(boundary).toEqual({
    previousPanelRule: '""',
    stripe: { top: "0px", right: "0px", bottom: "1px", left: "0px" },
    separatorRails: { right: "0px", left: "0px" },
    panelRails: {
      right: "1px",
      left: "1px",
      rightColor: "rgba(0, 0, 0, 0)",
      leftColor: "rgba(0, 0, 0, 0)",
    },
    railOverlay: {
      beforeContent: '""',
      beforeWidth: "1px",
      beforeZIndex: "10",
      afterContent: '""',
      afterWidth: "1px",
      afterZIndex: "10",
    },
    nextPanelRule: "none",
  });
});

test("rail annotations stay in the outer gutters on wide screens", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1279, height: 900 });
  await page.goto("/lab");
  await waitForLabControls(page);

  const annotationPanel = page.locator("#lab-annotations");
  const annotations = annotationPanel.locator('[data-slot="rail-annotation"]');
  await expect(annotations).toHaveCount(2);
  await expect(annotations.first()).toBeHidden();
  await expect(annotations.last()).toBeHidden();

  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(annotations.first()).toBeVisible();
  await expect(annotations.last()).toBeVisible();

  const overlayStyles = await annotations.evaluateAll((elements) =>
    elements.map((element) => ({
      position: getComputedStyle(element).position,
      beforeContent: getComputedStyle(element, "::before").content,
    })),
  );
  const annotatedPanelStyles = await page
    .locator("#lab-foundation, #lab-annotations")
    .evaluateAll((panels) =>
      panels.map((panel) => {
        const header = panel.querySelector('[data-slot="panel-header"]');
        return {
          panelBeforeContent: getComputedStyle(panel, "::before").content,
          headerBeforeContent: header
            ? getComputedStyle(header, "::before").content
            : "missing",
        };
      }),
    );

  expect(overlayStyles).toEqual([
    { position: "absolute", beforeContent: "none" },
    { position: "absolute", beforeContent: "none" },
  ]);
  expect(annotatedPanelStyles).toEqual([
    { panelBeforeContent: "none", headerBeforeContent: "none" },
    { panelBeforeContent: "none", headerBeforeContent: "none" },
  ]);

  const panelBox = await annotationPanel.boundingBox();
  const leftBox = await annotations
    .filter({ hasText: "left of the rail" })
    .boundingBox();
  const rightBox = await annotations
    .filter({ hasText: "to the right" })
    .boundingBox();
  const leftArrowHeadBox = await annotations
    .filter({ hasText: "left of the rail" })
    .locator('[data-slot="rail-annotation-arrow"] path')
    .last()
    .boundingBox();
  const rightArrowHeadBox = await annotations
    .filter({ hasText: "to the right" })
    .locator('[data-slot="rail-annotation-arrow"] path')
    .last()
    .boundingBox();

  expect(panelBox).not.toBeNull();
  expect(leftBox).not.toBeNull();
  expect(rightBox).not.toBeNull();
  expect(leftArrowHeadBox).not.toBeNull();
  expect(rightArrowHeadBox).not.toBeNull();
  expect(leftBox!.x + leftBox!.width).toBeLessThanOrEqual(panelBox!.x);
  expect(rightBox!.x).toBeGreaterThanOrEqual(panelBox!.x + panelBox!.width);
  expect(
    panelBox!.x - (leftArrowHeadBox!.x + leftArrowHeadBox!.width),
  ).toBeLessThanOrEqual(16);
  expect(
    rightArrowHeadBox!.x - (panelBox!.x + panelBox!.width),
  ).toBeLessThanOrEqual(16);
});

for (const { theme, width } of [
  { theme: "light", width: 360 },
  { theme: "dark", width: 1024 },
  { theme: "light", width: 1440 },
] as const) {
  test(`lab visual target: ${theme} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript((selectedTheme) => {
      localStorage.setItem("theme", selectedTheme);
    }, theme);
    await page.goto("/lab");
    await waitForLabControls(page);
    await page.evaluate(() => document.fonts.ready.then(() => undefined));
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    const geometry = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(geometry.scrollWidth).toBe(geometry.viewport);

    const pageHeight = await page.evaluate(() =>
      Math.ceil(document.documentElement.scrollHeight),
    );
    await page.setViewportSize({ width, height: pageHeight });
    await page.evaluate(() => window.scrollTo({ top: 0, left: 0 }));
    await page.waitForTimeout(100);

    await expect(page).toHaveScreenshot(`lab-${theme}-${width}.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.005,
    });
  });
}
