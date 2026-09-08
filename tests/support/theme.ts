import type { Page } from "@playwright/test";

/** Select a palette for rendering tests without relying on the OS preference. */
export async function storeTheme(page: Page, theme: "light" | "dark") {
  await page.addInitScript((value) => {
    localStorage.setItem("theme", value);
  }, theme);
}

/** Inspect both CSS palettes with page scripts disabled; not a preference-policy test. */
export async function showStaticTheme(page: Page, theme: "light" | "dark") {
  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;
  }, theme);
}
