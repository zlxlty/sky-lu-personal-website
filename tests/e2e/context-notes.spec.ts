import { expect, test } from "@playwright/test";

test("context notes sit outside their panels with arrows in the requested order", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const path of ["/", "/writing"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    const notes = [
      {
        text: "Dumping all my short recordings here.",
        side: "left",
        arrow: "up",
      },
      ...(path === "/"
        ? [{ text: "Scroll to the past", side: "right", arrow: "down" }]
        : []),
    ];
    for (const { text, side, arrow } of notes) {
      const note = page
        .locator('[data-slot="rail-annotation"]')
        .filter({ hasText: text });
      await expect(note).toBeVisible();
      const geometry = await note.evaluate((el) => {
        const box = (target: Element) => {
          const b = target.getBoundingClientRect();
          return { left: b.left, right: b.right, top: b.top, bottom: b.bottom };
        };
        const copy = el.querySelector('[data-slot="rail-annotation-copy"]');
        const paths = [...el.querySelectorAll("svg path")].map(box);
        if (!copy || !paths.length || !el.parentElement)
          throw new Error("Incomplete annotation");
        return {
          note: box(el),
          panel: box(el.parentElement),
          copy: box(copy),
          // Measure painted paths, not the rotated SVG's empty viewBox corners.
          arrow: {
            top: Math.min(...paths.map((path) => path.top)),
            bottom: Math.max(...paths.map((path) => path.bottom)),
          },
        };
      });
      if (side === "left")
        expect(geometry.note.right).toBeLessThan(geometry.panel.left);
      else expect(geometry.note.left).toBeGreaterThan(geometry.panel.right);
      if (arrow === "up")
        expect(geometry.arrow.bottom).toBeLessThan(geometry.copy.top);
      else expect(geometry.arrow.top).toBeGreaterThan(geometry.copy.bottom);
    }
    await page.setViewportSize({ width: 390, height: 900 });
    for (const { text } of notes)
      await expect(
        page.locator('[data-slot="rail-annotation"]').filter({ hasText: text }),
      ).toBeHidden();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
});
