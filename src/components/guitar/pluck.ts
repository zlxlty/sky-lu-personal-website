/** A musical gesture, independent of SVG coordinates and the audio backend. */
export interface GuitarPluck {
  readonly index: number;
  readonly strength: number;
  readonly delay: number;
}

export interface GuitarStringsHandle {
  pluck(index: number, strength: number): void;
  reset(): void;
}

/** A gentler audio response than the visual impulse; full strength takes 3 SVG units/ms. */
export const strumStrength = (velocity: number) =>
  Math.max(0.15, Math.min(1, Math.max(0, velocity) / 3) ** 1.35);
