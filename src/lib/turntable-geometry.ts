/** Coordinates use the drawing's 238 × 200 SVG viewBox. */
export const tonearm = {
  pivot: { x: 214, y: 33 },
  cartridge: { x: 198, y: 148, tilt: 38.66 },
  needleLength: 17,
  minAngle: 0,
  maxAngle: 34,
  playAngle: 24,
} as const;

const radians = (degrees: number) => (degrees * Math.PI) / 180;
export const clampArmAngle = (angle: number) =>
  Math.max(tonearm.minAngle, Math.min(tonearm.maxAngle, angle));

export function needlePosition(angle: number) {
  const { pivot, cartridge, needleLength } = tonearm;
  const x =
    cartridge.x - Math.sin(radians(cartridge.tilt)) * needleLength - pivot.x;
  const y =
    cartridge.y + Math.cos(radians(cartridge.tilt)) * needleLength - pivot.y;
  const rotation = radians(angle);
  return {
    x: pivot.x + x * Math.cos(rotation) - y * Math.sin(rotation),
    y: pivot.y + x * Math.sin(rotation) + y * Math.cos(rotation),
  };
}

export function needleOnRecord(angle: number) {
  const needle = needlePosition(angle);
  const radius = Math.hypot(needle.x - 100, needle.y - 100);
  return radius >= 28 && radius <= 78;
}

export function pointerAngle(point: { x: number; y: number }) {
  return (
    (Math.atan2(point.y - tonearm.pivot.y, point.x - tonearm.pivot.x) * 180) /
    Math.PI
  );
}

/** Shortest signed difference avoids a jump across atan2's ±180° boundary. */
export const angularDelta = (from: number, to: number) =>
  ((to - from + 540) % 360) - 180;
