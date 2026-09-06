import { describe, expect, it } from "vitest";
import {
  angularDelta,
  clampArmAngle,
  needleOnRecord,
  needlePosition,
  tonearm,
} from "@/lib/turntable-geometry";

describe("tonearm geometry", () => {
  it("keeps the rest outside the disc and the playing arc outside the label", () => {
    expect(needleOnRecord(0)).toBe(false);
    for (let angle = tonearm.playAngle; angle <= tonearm.maxAngle; angle++) {
      const needle = needlePosition(angle);
      expect(needleOnRecord(angle)).toBe(true);
      expect(Math.hypot(needle.x - 100, needle.y - 100)).toBeGreaterThan(28);
    }
  });
  it("limits movement at both mechanical stops", () => {
    expect(clampArmAngle(-90)).toBe(0);
    expect(clampArmAngle(90)).toBe(34);
    expect(clampArmAngle(24)).toBe(24);
  });
  it("does not jump when pointer angles cross the atan2 seam", () => {
    expect(angularDelta(179, -179)).toBe(2);
    expect(angularDelta(-179, 179)).toBe(-2);
  });
});
