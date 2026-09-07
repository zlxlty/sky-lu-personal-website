import { describe, expect, it } from "vitest";
import {
  createStrings,
  crossedStrings,
  pluckAmplitude,
  stringPath,
  type GuitarLayout,
} from "@/components/guitar/string-geometry";

const layout: GuitarLayout = {
  width: 100,
  height: 100,
  hole: { x: 50, y: 50, radius: 30 },
  angle: 0,
  length: 100,
  spacing: 10,
};

describe("guitar string geometry", () => {
  it.each([0, 12, 18, 52])(
    "keeps six increasing gauges with bass below treble at %i degrees",
    (angle) => {
      const strings = createStrings({ ...layout, angle });
      expect(strings.map((string) => string.note)).toEqual([
        "E4",
        "B3",
        "G3",
        "D3",
        "A2",
        "E2",
      ]);
      for (const [index, string] of strings.entries()) {
        const previous = strings[index - 1];
        if (!previous) continue;
        expect(string.strokeWidth).toBeGreaterThan(previous.strokeWidth);
        expect(string.from.y + string.to.y).toBeGreaterThan(
          previous.from.y + previous.to.y,
        );
      }
    },
  );

  it.each([
    { angle: 0, start: { x: 50, y: 0 }, end: { x: 50, y: 100 } },
    { angle: 45, start: { x: 100, y: 0 }, end: { x: 0, y: 100 } },
  ])(
    "orders rapid strums geometrically at $angle degrees",
    ({ angle, start, end }) => {
      const strings = createStrings({ ...layout, angle });
      const down = crossedStrings(start, end, strings);
      expect(down.map(({ index }) => index)).toEqual([0, 1, 2, 3, 4, 5]);
      expect(
        down.every(
          ({ direction, position }) =>
            direction === 1 && Math.abs(position - 0.5) < 0.00001,
        ),
      ).toBe(true);
      expect(
        crossedStrings(end, start, strings).map(({ index }) => index),
      ).toEqual([5, 4, 3, 2, 1, 0]);
    },
  );

  it("ignores parallel movement, stationary samples, and crossings beyond the endpoints", () => {
    const strings = createStrings(layout);
    expect(crossedStrings({ x: 0, y: 0 }, { x: 100, y: 0 }, strings)).toEqual(
      [],
    );
    expect(crossedStrings({ x: 50, y: 50 }, { x: 50, y: 50 }, strings)).toEqual(
      [],
    );
    expect(
      crossedStrings({ x: 120, y: 0 }, { x: 120, y: 100 }, strings),
    ).toEqual([]);
    expect(
      crossedStrings({ x: 50, y: 0 }, { x: 50, y: 25 }, strings).map(
        ({ index }) => index,
      ),
    ).toEqual([0]);
    expect(crossedStrings({ x: 50, y: 25 }, { x: 50, y: 30 }, strings)).toEqual(
      [],
    );
  });

  it("keeps endpoints fixed during vibration and bounds gesture strength", () => {
    const string = createStrings(layout)[0];
    if (!string) throw new Error("Expected string");
    const path = stringPath(string, 18);
    expect(path).toMatch(/^M0\.00 25\.00/);
    expect(path).toMatch(/L100\.00 25\.00$/);
    expect(pluckAmplitude(0)).toBe(2);
    expect(pluckAmplitude(999)).toBe(9);
  });
});
