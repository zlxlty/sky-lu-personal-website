import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("the CV is served as an unchanged PDF asset", async ({ request }) => {
  const original = await readFile("public/cv.pdf");
  const response = await request.get("/cv.pdf");

  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/pdf");
  expect((await response.body()).equals(original)).toBe(true);
  expect((await readFile("dist/cv.pdf")).equals(original)).toBe(true);
});

test("the short CV URL has a static redirect to the PDF", async ({
  request,
}) => {
  const response = await request.get("/cv");
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('http-equiv="refresh"');
  expect(await response.text()).toContain("url=/cv.pdf");
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`CV navigation in ${colorScheme} without JavaScript`, () => {
    test.use({ colorScheme, javaScriptEnabled: false });

    for (const width of [320, 1440]) {
      test(`the PDF link fits and is keyboard reachable at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        const link = page.getByRole("link", { name: "CV (PDF)", exact: true });
        await expect(link).toHaveAttribute("href", "/cv.pdf");
        await expect(link).toBeInViewport();

        await page.keyboard.press("Tab"); // Skip link.
        await page.keyboard.press("Tab"); // Writing.
        await page.keyboard.press("Tab"); // Projects.
        await page.keyboard.press("Tab"); // CV.
        await expect(link).toBeFocused();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth,
          ),
        ).toBe(true);
      });
    }
  });
}
