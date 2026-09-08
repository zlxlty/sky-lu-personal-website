import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/lab");
  await page.addStyleTag({
    content: "astro-dev-toolbar { display: none !important; }",
  });
  await expect(page.locator('[data-slot="lab-controls"]')).toHaveAttribute(
    "data-hydrated",
    "true",
  );
});

for (const theme of ["light", "dark"] as const) {
  test(`dialog and sheet actions remain reachable on short ${theme} screens`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
      await page.locator("[data-theme-toggle]").click();
    }
    await page.setViewportSize({ width: 360, height: 200 });
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);

    const dialogTrigger = page.getByRole("button", {
      name: "Open dialog",
      exact: true,
    });
    await dialogTrigger.focus();
    await dialogTrigger.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Research note" });
    await expect(dialog).toBeInViewport({ ratio: 1 });
    const closeDialog = dialog.getByRole("button", {
      name: "Close dialog",
      exact: true,
    });
    await closeDialog.focus();
    await expect(closeDialog).toBeInViewport({ ratio: 1 });
    await expectUnclippedFocusOutline(closeDialog);
    await closeDialog.press("Enter");
    await expect(dialogTrigger).toBeFocused();

    await page.setViewportSize({ width: 667, height: 280 });
    const sheetTrigger = page.getByRole("button", {
      name: "Open sheet",
      exact: true,
    });
    await sheetTrigger.focus();
    await sheetTrigger.press("Enter");
    const sheet = page.getByRole("dialog", { name: "Navigation specimen" });
    await expect(sheet).toBeInViewport({ ratio: 1 });
    await expect(
      sheet.getByRole("button", { name: "Writing", exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const closeSheet = sheet.getByRole("button", {
      name: "Close sheet",
      exact: true,
    });
    await expect(closeSheet).toBeFocused();
    await expect(closeSheet).toBeInViewport({ ratio: 1 });
    await expectUnclippedFocusOutline(closeSheet);
    await closeSheet.press("Enter");
    await expect(sheetTrigger).toBeFocused();
  });

  test(`command dialog restores focus after Escape and selection in ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
      await page.locator("[data-theme-toggle]").click();
    }
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error" || message.type() === "warning") {
        runtimeErrors.push(message.text());
      }
    });

    const trigger = page.getByRole("button", {
      name: "Open command dialog",
      exact: true,
    });
    const dialog = page.getByRole("dialog", {
      name: "Navigate the component lab",
    });
    await trigger.click();
    await expect(dialog.getByRole("combobox")).toBeFocused();
    const accessibility = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.press("Enter");
    await dialog.getByRole("combobox").fill("jazz");
    await page.keyboard.press("Enter");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(runtimeErrors).toEqual([]);
  });
}

test("command input and results fit a constrained viewport", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 360, height: 160 });
  await page
    .getByRole("button", { name: "Open command dialog", exact: true })
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Navigate the component lab",
  });
  await expect(dialog).toBeInViewport({ ratio: 1 });
  const input = dialog.getByRole("combobox");
  await expect(input).toBeInViewport({ ratio: 1 });
  await input.press("End");
  await expect(dialog.getByRole("option", { name: "Jazz J" })).toBeInViewport({
    ratio: 1,
  });
  await expect(input).toBeInViewport({ ratio: 1 });
});

for (const mode of ["light", "dark", "forced-colors"] as const) {
  test(`command input uses a visible focus line without a box in ${mode}`, async ({
    page,
  }) => {
    await page.emulateMedia({
      colorScheme: mode === "dark" ? "dark" : "light",
      forcedColors: mode === "forced-colors" ? "active" : "none",
      reducedMotion: "reduce",
    });
    await page.setViewportSize({ width: 1440, height: 900 });

    const theme = mode === "dark" ? "dark" : "light";
    if ((await page.locator("html").getAttribute("data-theme")) !== theme) {
      await page.locator("[data-theme-toggle]").click();
    }

    const inlineInput = page.getByRole("combobox", {
      name: "Filter lab destinations",
    });
    await inlineInput.focus();
    await expectCommandFocusLine(inlineInput);

    const trigger = page.getByRole("button", {
      name: "Open command dialog",
      exact: true,
    });
    await trigger.focus();
    expect(
      await inlineInput.evaluate((input) => {
        const row = input.parentElement;
        if (!row) throw new Error("Missing command input row");
        return getComputedStyle(row, "::after").borderBottomWidth;
      }),
    ).toBe("0px");
    await trigger.press("Enter");
    const input = page
      .getByRole("dialog", { name: "Navigate the component lab" })
      .getByRole("combobox");
    await expectCommandFocusLine(input);

    await page.setViewportSize({ width: 360, height: 160 });
    await input.press("End");
    await expectCommandFocusLine(input);
  });
}

async function expectCommandFocusLine(input: Locator) {
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS("outline-style", "none");
  const row = input.locator("..");
  await expect(row).toBeInViewport({ ratio: 1 });
  const line = await row.evaluate((element) => {
    const style = getComputedStyle(element, "::after");
    return {
      style: style.borderBottomStyle,
      width: parseFloat(style.borderBottomWidth),
      color: style.borderBottomColor,
      bottom: style.bottom,
    };
  });
  expect(line.style).toBe("solid");
  expect(line.width).toBeGreaterThanOrEqual(2);
  expect(line.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(line.bottom).toBe("0px");
}

async function expectUnclippedFocusOutline(control: Locator) {
  await expect(control).toBeFocused();
  const outline = await control.evaluate((element) => {
    const style = getComputedStyle(element);
    const width = parseFloat(style.outlineWidth);
    const outset = width + parseFloat(style.outlineOffset);
    const rect = element.getBoundingClientRect();
    const painted = {
      top: rect.top - outset,
      right: rect.right + outset,
      bottom: rect.bottom + outset,
      left: rect.left - outset,
    };
    const clippedBy: string[] = [];

    for (
      let ancestor = element.parentElement;
      ancestor;
      ancestor = ancestor.parentElement
    ) {
      const ancestorStyle = getComputedStyle(ancestor);
      const box = ancestor.getBoundingClientRect();
      const left = box.left + ancestor.clientLeft;
      const top = box.top + ancestor.clientTop;
      const clipsX = /^(auto|scroll|hidden|clip)$/.test(
        ancestorStyle.overflowX,
      );
      const clipsY = /^(auto|scroll|hidden|clip)$/.test(
        ancestorStyle.overflowY,
      );
      if (
        (clipsX &&
          (painted.left < left ||
            painted.right > left + ancestor.clientWidth)) ||
        (clipsY &&
          (painted.top < top || painted.bottom > top + ancestor.clientHeight))
      ) {
        clippedBy.push(ancestor.getAttribute("data-slot") ?? ancestor.tagName);
      }
    }

    if (
      painted.top < 0 ||
      painted.left < 0 ||
      painted.right > innerWidth ||
      painted.bottom > innerHeight
    ) {
      clippedBy.push("viewport");
    }

    return {
      style: style.outlineStyle,
      width,
      color: style.outlineColor,
      clippedBy,
    };
  });
  expect(outline.style).toBe("solid");
  expect(outline.width).toBeGreaterThanOrEqual(2);
  expect(outline.color).not.toBe("rgba(0, 0, 0, 0)");
  expect(outline.clippedBy).toEqual([]);
}
