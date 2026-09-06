import type { Page } from "@playwright/test";

/** Inspect physical seams, including adjacent pixels that form a doubled line. */
export async function inspectBlueprintRules(
  page: Page,
  regionSelector: string,
) {
  return page.evaluate((selector) => {
    const regions = [
      ...document.querySelectorAll<HTMLElement>(selector),
    ].filter((element) => element.getBoundingClientRect().height > 0);
    const edges = [
      ...new Set(
        regions.flatMap((element) => {
          const bounds = element.getBoundingClientRect();
          return [bounds.top, bounds.bottom];
        }),
      ),
    ];
    const rules = [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((element) => element.getClientRects().length > 0)
      .flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        return ["::before", "::after"].flatMap((pseudo) => {
          const style = getComputedStyle(element, pseudo);
          if (
            style.content === "none" ||
            style.display === "none" ||
            style.visibility === "hidden" ||
            style.position !== "absolute" ||
            Number.parseFloat(style.height) !== 1
          )
            return [];
          const top = Number.parseFloat(style.top);
          const bottom = Number.parseFloat(style.bottom);
          const x = bounds.left + Number.parseFloat(style.left);
          const y = Number.isFinite(top)
            ? bounds.top + top
            : bounds.bottom - bottom - 1;
          return [
            {
              owner:
                element.id ||
                element.dataset.region ||
                element.dataset.slot ||
                element.tagName,
              pseudo,
              y,
              fullWidth:
                x <= 0 && x + Number.parseFloat(style.width) >= innerWidth,
            },
          ];
        });
      });
    return edges.map((edge) => ({
      edge,
      owners: rules.filter(({ y }) => y >= edge - 1.01 && y <= edge + 0.01),
    }));
  }, regionSelector);
}

/** Decode the browser's own screenshot without adding a PNG library. */
export async function screenshotPixels(
  page: Page,
  points: { x: number; y: number }[],
) {
  const png = await page.screenshot({ scale: "css" });
  return page.evaluate(
    async ({ encoded, samples }) => {
      const bytes = Uint8Array.from(atob(encoded), (character) =>
        character.charCodeAt(0),
      );
      const bitmap = await createImageBitmap(
        new Blob([bytes], { type: "image/png" }),
      );
      const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Missing screenshot decoder context");
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
      return samples.map(({ x, y }) => [
        ...context.getImageData(Math.round(x), Math.round(y), 1, 1).data,
      ]);
    },
    { encoded: png.toString("base64"), samples: points },
  );
}
