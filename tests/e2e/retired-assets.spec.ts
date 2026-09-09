import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("the retired resume is absent from source, build output, and public URLs", async ({
  request,
}) => {
  for (const path of ["public/cv.pdf", "dist/cv.pdf", "dist/cv/index.html"]) {
    expect(existsSync(path), path).toBe(false);
  }
  for (const path of ["/cv", "/cv/", "/cv.pdf"]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
    // Astro may reject a noncanonical missing path with an empty 404 response.
    expect(response.headers()["content-type"] ?? "").not.toContain(
      "application/pdf",
    );
  }
  const files = await readdir("dist", { recursive: true });
  for (const file of files.filter((file) => file.endsWith(".html"))) {
    const html = await readFile(`dist/${file}`, "utf8");
    expect(html, file).not.toMatch(
      /(?:href|src)=["']\/cv(?:\.pdf|\/)?(?:[?#][^"']*)?["']/,
    );
  }
});

for (const colorScheme of ["light", "dark"] as const) {
  test.describe(`site navigation with ${colorScheme} OS preference without JavaScript`, () => {
    test.use({ colorScheme, javaScriptEnabled: false });
    for (const width of [320, 1440]) {
      test(`public navigation excludes the retired CV at ${width}px`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto("/");
        const navigation = page.getByRole("navigation", {
          name: "Main navigation",
        });
        await expect(navigation.getByRole("link")).toHaveText([
          "Writings",
          "Projects",
          "People",
        ]);
        await page.keyboard.press("Tab"); // Skip link.
        await page.keyboard.press("Tab"); // Writings.
        await page.keyboard.press("Tab"); // Projects.
        await page.keyboard.press("Tab"); // People.
        await expect(
          navigation.getByRole("link", { name: "People" }),
        ).toBeFocused();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBe(width);
      });
    }
  });
}
