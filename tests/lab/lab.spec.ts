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

test("lab exposes the real design system without accessibility errors", async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const response = await page.goto("/lab");
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

for (const { theme, width } of [
  { theme: "light", width: 360 },
  { theme: "dark", width: 1024 },
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
