import { expect, test, type Locator } from "@playwright/test";

async function svgPoint(element: Locator, x: number, y: number) {
  return element.evaluate(
    (node, point) => {
      if (!(node instanceof SVGGraphicsElement))
        throw new Error("Expected SVG");
      const matrix = node.getScreenCTM();
      if (!matrix) throw new Error("Missing SVG transform");
      const position = new DOMPoint(point.x, point.y).matrixTransform(matrix);
      return { x: position.x, y: position.y };
    },
    { x, y },
  );
}

for (const input of ["mouse", "touch"] as const) {
  test.describe(input, () => {
    test.use({
      hasTouch: true,
      isMobile: input === "touch",
      viewport: { width: input === "touch" ? 390 : 1440, height: 950 },
      contextOptions: { reducedMotion: "reduce" },
    });

    test("turntable focus has no native box after using the guitar", async ({
      page,
    }) => {
      await page.goto("/");
      const guitar = page.locator("[data-guitar]");
      await expect(guitar).toHaveAttribute("data-ready");
      await guitar.scrollIntoViewIfNeeded();
      const point = await guitar
        .locator("[data-string-ink]")
        .nth(2)
        .evaluate((node) => {
          if (!(node instanceof SVGPathElement))
            throw new Error("Expected string");
          const matrix = node.getScreenCTM();
          if (!matrix) throw new Error("Missing string transform");
          const position = node
            .getPointAtLength(node.getTotalLength() / 2)
            .matrixTransform(matrix);
          return { x: position.x, y: position.y };
        });
      const activate = async ({ x, y }: { x: number; y: number }) => {
        if (input === "touch") await page.touchscreen.tap(x, y);
        else await page.mouse.click(x, y);
      };
      await activate(point);
      const player = page.locator("local-record");
      await player.scrollIntoViewIfNeeded();
      const arm = player.getByRole("slider", { name: "Tonearm position" });
      const record = player.getByRole("button", { name: "Change record" });
      await expect(arm).toHaveAttribute("tabindex", "0");
      // Transfer pointer focus between both SVG controls to exercise :focus
      // without :focus-visible, including after the first programmatic focus.
      for (const [control, x, y] of [
        [record, 100, 100],
        [arm, 198, 155],
        [record, 100, 100],
      ] as const) {
        await activate(await svgPoint(control, x, y));
        await expect(control).toBeFocused();
        expect
          .soft(
            await control.evaluate(
              (node) => getComputedStyle(node).outlineStyle,
            ),
          )
          .toBe("none");
      }
      if (input === "mouse") {
        await page.keyboard.press("Tab");
        await expect(arm).toBeFocused();
        await expect(arm).toHaveCSS("outline-style", "none");
        await expect(arm.locator("[data-turntable-cartridge]")).toHaveCSS(
          "stroke-width",
          "2.5px",
        );
        await page.keyboard.press("Shift+Tab");
        await expect(record).toBeFocused();
        await expect(record.locator("[data-turntable-rim]")).toHaveCSS(
          "stroke-width",
          "2px",
        );
        await expect(record.locator("[data-turntable-rim]")).toHaveCSS(
          "stroke-opacity",
          "1",
        );
      }
    });
  });
}
