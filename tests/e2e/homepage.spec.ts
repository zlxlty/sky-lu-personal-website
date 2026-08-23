import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("homepage satisfies the production smoke contract", async ({ page }) => {
  const response = await page.goto("/");
  const accessibility = await new AxeBuilder({ page }).analyze();

  expect({
    status: response?.status(),
    title: await page.title(),
    heading: await page.getByRole("heading", { level: 1 }).textContent(),
    accessibilityViolations: accessibility.violations.map(({ id }) => id),
  }).toEqual({
    status: 200,
    title: "Sky Lu",
    heading: "Sky Lu",
    accessibilityViolations: [],
  });
});
