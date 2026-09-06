/** A repeatable pen gesture, projected into the requested CSS-pixel dimensions. */
export function createSketchPath(
  seed: string,
  width = 100,
  height = 12,
): string {
  let state = 2166136261;
  for (const character of seed) {
    state = Math.imul(state ^ character.charCodeAt(0), 16777619);
  }
  const between = (min: number, max: number) => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const fraction = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    return min + fraction * (max - min);
  };
  const x = (min: number, max: number) =>
    ((between(min, max) * width) / 100).toFixed(2);
  const y = (min: number, max: number) =>
    ((between(min, max) * height) / 12).toFixed(2);

  // Successively shorter return strokes, with independent bends and endpoints.
  return [
    `M ${x(1, 5)} ${y(3, 5)}`,
    `Q ${x(38, 58)} ${y(-1, 2)} ${x(94, 99)} ${y(5, 7)}`,
    `Q ${x(48, 65)} ${y(1, 4)} ${x(9, 19)} ${y(6, 8)}`,
    `Q ${x(43, 57)} ${y(4, 6)} ${x(69, 84)} ${y(9, 11)}`,
    `Q ${x(44, 57)} ${y(6, 9)} ${x(22, 36)} ${y(9, 11)}`,
  ].join(" ");
}
