import { guitarVoicing } from "./voicing";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface GuitarLayout {
  readonly width: number;
  readonly height: number;
  readonly hole: Point & { readonly radius: number };
  readonly angle: number;
  readonly length: number;
  readonly spacing: number;
}

export interface GuitarString {
  readonly index: number;
  readonly name: string;
  readonly note: string;
  readonly strokeWidth: number;
  readonly from: Point;
  readonly to: Point;
  readonly normal: Point;
}

// Preserve high E at 0.7 CSS px; the other widths follow the physical gauges.
const baseStrokeWidth = 0.7;

export function createStrings(layout: GuitarLayout): readonly GuitarString[] {
  const angle = (layout.angle * Math.PI) / 180;
  const axis = { x: Math.cos(angle), y: Math.sin(angle) };
  const normal = { x: -axis.y, y: axis.x };
  return guitarVoicing.strings.map((string, index) => {
    const offset = (index - 2.5) * layout.spacing;
    const center = {
      x: layout.hole.x + normal.x * offset,
      y: layout.hole.y + normal.y * offset,
    };
    return {
      name: string.name,
      note: string.note,
      strokeWidth: baseStrokeWidth * (string.gauge / 0.012),
      index,
      normal,
      from: {
        x: center.x - (axis.x * layout.length) / 2,
        y: center.y - (axis.y * layout.length) / 2,
      },
      to: {
        x: center.x + (axis.x * layout.length) / 2,
        y: center.y + (axis.y * layout.length) / 2,
      },
    };
  });
}

const subtract = (a: Point, b: Point): Point => ({
  x: a.x - b.x,
  y: a.y - b.y,
});
const cross = (a: Point, b: Point) => a.x * b.y - a.y * b.x;

/** Finite segment intersections, ordered along the gesture, independent of tilt. */
export function crossedStrings(
  previous: Point,
  current: Point,
  strings: readonly GuitarString[],
) {
  const movement = subtract(current, previous);
  return strings
    .flatMap((string) => {
      const span = subtract(string.to, string.from);
      const determinant = cross(movement, span);
      if (Math.abs(determinant) < 0.00001) return [];
      const offset = subtract(string.from, previous);
      const fraction = cross(offset, span) / determinant;
      const position = cross(offset, movement) / determinant;
      // Exclude a segment's start so two consecutive samples don't pluck twice.
      if (fraction <= 0 || fraction > 1 || position < 0 || position > 1)
        return [];
      return [
        {
          index: string.index,
          fraction,
          position,
          direction: Math.sign(
            movement.x * string.normal.x + movement.y * string.normal.y,
          ),
        },
      ];
    })
    .sort((a, b) => a.fraction - b.fraction);
}

export function stringPath(string: GuitarString, displacement = 0) {
  if (!displacement)
    return `M${string.from.x} ${string.from.y}L${string.to.x} ${string.to.y}`;
  return Array.from({ length: 33 }, (_, index) => {
    const t = index / 32;
    const offset = displacement * Math.sin(Math.PI * t);
    const x =
      string.from.x +
      (string.to.x - string.from.x) * t +
      string.normal.x * offset;
    const y =
      string.from.y +
      (string.to.y - string.from.y) * t +
      string.normal.y * offset;
    return `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join("");
}

export const pluckAmplitude = (velocity: number) =>
  Math.min(9, Math.max(2, velocity * 4.5));
