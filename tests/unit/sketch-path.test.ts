import { describe, expect, it } from "vitest";
import { createSketchPath } from "@/lib/sketch-path";

describe("sketch pen gestures", () => {
  it("preserves the gesture while adapting width and height independently", () => {
    const coordinates = (path: string) =>
      path.match(/-?\d+\.\d+/g)?.map(Number) ?? [];
    const original = coordinates(createSketchPath("long heading"));
    const resized = coordinates(createSketchPath("long heading", 800, 24));
    resized.forEach((value, index) => {
      expect(
        Math.abs(value - original[index] * (index % 2 === 0 ? 8 : 2)),
      ).toBeLessThan(0.05);
    });
  });
  it("keeps the same identity stable while varying curves and stroke lengths", () => {
    expect(createSketchPath("project:tundra:0")).toBe(
      createSketchPath("project:tundra:0"),
    );
    const paths = Array.from({ length: 128 }, (_, index) =>
      createSketchPath(`label:${index}`),
    );
    expect(new Set(paths).size).toBe(128);
    for (const path of paths) {
      expect(path.match(/Q/g)).toHaveLength(4);
      expect(path).not.toMatch(/NaN|Infinity/);
      const coordinates = path.match(/-?\d+\.\d+/g)?.map(Number) ?? [];
      expect(coordinates).toHaveLength(18);
      coordinates.forEach((value, index) => {
        expect(value).toBeGreaterThanOrEqual(index % 2 === 0 ? 0 : -1);
        expect(value).toBeLessThanOrEqual(index % 2 === 0 ? 100 : 12);
      });
    }
  });
});
