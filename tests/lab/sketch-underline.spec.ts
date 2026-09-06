import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const colorScheme of ["light", "dark"] as const) {
  for (const width of [320, 1440]) {
    test(`sketch marks follow each text line at ${width}px in ${colorScheme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
      await page.goto("/lab/underline");
      await expect(
        page.locator("sketch-underline:not([data-ready])"),
      ).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      for (const mark of await page.locator("sketch-underline").all()) {
        const geometry = await mark.evaluate((element) => {
          const label = element.querySelector("[data-sketch-label]");
          const paths = [...element.querySelectorAll("path")];
          if (!label) throw new Error("Missing text label");
          const bounds = ({ left, right, top, bottom }: DOMRect) => ({
            left,
            right,
            top,
            bottom,
          });
          return {
            font: Number.parseFloat(getComputedStyle(label).fontSize),
            text: [...label.getClientRects()].map(bounds),
            paths: paths.map((path) => bounds(path.getBoundingClientRect())),
          };
        });
        expect(geometry.paths).toHaveLength(geometry.text.length);
        geometry.paths.forEach((path, index) => {
          const text = geometry.text[index];
          expect(path.left).toBeGreaterThanOrEqual(text.left - 1);
          expect(path.right).toBeLessThanOrEqual(text.right + 1);
          expect(path.top).toBeGreaterThanOrEqual(
            text.bottom - geometry.font * 0.15,
          );
          expect(path.bottom).toBeLessThanOrEqual(
            text.bottom + geometry.font * 0.5,
          );
          const next = geometry.text[index + 1];
          if (next) expect(path.bottom).toBeLessThan(next.top);
        });
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      expect(
        (
          await new AxeBuilder({ page })
            .exclude("astro-dev-toolbar")
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
    });
  }
}

test("cached paths survive hover, theme changes, and responsive reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.goto("/lab/underline");
  const link = page.locator("[data-wrapped-link]");
  const mark = link.locator("sketch-underline");
  await expect(mark).toHaveAttribute("data-ready", "");
  const path = await mark.locator("path").first().elementHandle();
  if (!path) throw new Error("Missing generated path");
  const original = await path.getAttribute("d");
  for (let count = 0; count < 3; count++) {
    await link.hover();
    await page
      .getByRole("heading", { name: "Sketch underlines", exact: true })
      .hover();
  }
  expect(await path.getAttribute("d")).toBe(original);
  await page.getByRole("button", { name: /Switch to .* theme/ }).click();
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.locator("[data-wrapped-specimen]").evaluate((element) => {
    if (element instanceof HTMLElement) element.style.maxWidth = "11rem";
  });
  await expect.poll(() => mark.locator("path").count()).toBeGreaterThan(3);
  expect(
    await path.evaluate(
      (element) =>
        element === document.querySelector("[data-wrapped-link] path"),
    ),
  ).toBe(true);
  expect(await path.getAttribute("d")).not.toBe(original);
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.locator("[data-wrapped-specimen]").evaluate((element) => {
    if (element instanceof HTMLElement) element.style.maxWidth = "";
  });
  await expect.poll(() => path.getAttribute("d")).toBe(original);
});

test("long headings have taller gestures and draw every wrapped line", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lab/underline");
  const longLink = page.getByRole("link", {
    name: "Systems, software, and sound",
    exact: true,
  });
  const mark = longLink.locator("sketch-underline");
  await expect(mark).toHaveAttribute("data-ready", "");
  const geometry = await mark.evaluate((element) => {
    const path = element.querySelector("path");
    if (!path) throw new Error("Missing path");
    return {
      height: path.getBoundingClientRect().height,
      font: Number.parseFloat(getComputedStyle(element).fontSize),
    };
  });
  expect(geometry.height).toBeGreaterThan(geometry.font * 0.25);
  for (const link of [
    longLink,
    page.locator("[data-wrapped-link]"),
    page.locator("[data-inline-link]"),
  ]) {
    await link.hover();
    await expect(link.locator("svg")).toHaveCSS("visibility", "visible");
    for (const path of await link.locator("path").all()) {
      await expect(path).toHaveCSS("stroke-dashoffset", "0px");
    }
  }
});

test("text updates and reconnects refresh geometry without leaking observers", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/lab/underline");
  const mark = page.locator("[data-wrapped-link] sketch-underline");
  await expect(mark).toHaveAttribute("data-ready", "");
  const element = await mark.elementHandle();
  if (!element) throw new Error("Missing underline element");
  await mark.locator("[data-sketch-label]").evaluate((label) => {
    label.textContent = "Short label";
  });
  await expect(mark.locator("path")).toHaveCount(1);
  const path = await mark.locator("path").getAttribute("d");
  await element.evaluate((node) => node.remove());
  await page.setViewportSize({ width: 320, height: 900 });
  await element.evaluate((node) =>
    document.querySelector("[data-wrapped-link]")?.append(node),
  );
  await expect(mark).toHaveAttribute("data-ready", "");
  expect(await mark.locator("path").getAttribute("d")).toBe(path);
  await mark.evaluate((node) =>
    node.setAttribute("data-seed", "a new identity"),
  );
  await expect(mark.locator("path")).not.toHaveAttribute("d", path ?? "");
  expect(errors).toEqual([]);
});
