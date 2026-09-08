import { expect, test } from "@playwright/test";

test.use({
  hasTouch: true,
  isMobile: true,
  viewport: { width: 390, height: 844 },
  contextOptions: { reducedMotion: "reduce" },
});

for (const transfer of [false, true]) {
  test(`mobile taps pluck each string${transfer ? " through a capture transfer" : ""}`, async ({
    page,
  }) => {
    await page.goto("/");
    const guitar = page.locator("[data-guitar]");
    await expect(guitar).toHaveAttribute("data-ready");
    await guitar.scrollIntoViewIfNeeded();
    const plucks = await guitar.evaluateHandle((svg) => {
      const hits: number[] = [];
      const observer = new MutationObserver((changes) => {
        for (const { target } of changes) {
          if (
            target instanceof Element &&
            target.hasAttribute("data-vibrating")
          )
            hits.push(Number(target.getAttribute("data-guitar-string")));
        }
      });
      observer.observe(svg, {
        subtree: true,
        attributes: true,
        attributeFilter: ["data-vibrating"],
      });
      return { hits, disconnect: () => observer.disconnect() };
    });
    if (transfer) {
      await guitar.evaluate((svg) => {
        // Replay the old child's bubbling event after the SVG takes capture.
        // The touch itself still comes from the browser's native tap API.
        window.addEventListener("pointerdown", (event) => {
          const target = event.target;
          if (!(target instanceof Element) || !svg.contains(target)) return;
          target.dispatchEvent(
            new PointerEvent("lostpointercapture", {
              bubbles: true,
              pointerId: event.pointerId,
              pointerType: event.pointerType,
            }),
          );
        });
      });
    }
    for (let index = 0; index < 6; index++) {
      const point = await guitar.evaluate((svg, stringIndex) => {
        if (!(svg instanceof SVGSVGElement)) throw new Error("Expected SVG");
        const path =
          svg.querySelectorAll<SVGPathElement>("[data-string-ink]")[
            stringIndex
          ];
        if (!path) throw new Error("Missing string geometry");
        const point = path.getPointAtLength(path.getTotalLength() / 2);
        const bounds = svg.getBoundingClientRect();
        const viewBox = svg.viewBox.baseVal;
        // Aim from rendered bounds, independently of the handler's screen CTM.
        return {
          x: bounds.x + (point.x / viewBox.width) * bounds.width,
          y: bounds.y + (point.y / viewBox.height) * bounds.height,
        };
      }, index);
      await page.touchscreen.tap(point.x, point.y);
      // Retain the observed pluck: WebKit's round trip can outlast the 160ms
      // reduced-motion pulse when the complete browser suite runs in parallel.
      await expect
        .poll(() => plucks.evaluate(({ hits }) => hits))
        .toEqual(Array.from({ length: index + 1 }, (_, i) => i));
      await expect(guitar).not.toHaveAttribute("data-armed");
    }
    await expect(guitar.locator("[data-vibrating]")).toHaveCount(0);
    await plucks.evaluate(({ disconnect }) => disconnect());
    await plucks.dispose();
  });
}
