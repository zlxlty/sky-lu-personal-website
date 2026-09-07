import { describe, expect, it } from "vitest";
import { guitarVoicing } from "@/components/guitar/voicing";

describe("E♭m11/B♭ guitar voicing", () => {
  it("uses the playable 664664 shape in standard tuning", () => {
    const bassToTreble = guitarVoicing.strings.toReversed();
    expect(bassToTreble.map((string) => string.openMidi)).toEqual([
      40, 45, 50, 55, 59, 64,
    ]);
    expect(bassToTreble.map((string) => string.fret)).toEqual([
      6, 6, 4, 6, 6, 4,
    ]);
    expect(bassToTreble.map((string) => string.midi)).toEqual([
      46, 51, 54, 61, 65, 68,
    ]);
    expect(bassToTreble.map((string) => string.note)).toEqual([
      "B♭2",
      "E♭3",
      "G♭3",
      "D♭4",
      "F4",
      "A♭4",
    ]);
  });

  it("assigns exactly 5–1–♭3–♭7–9–11 from bass to treble with E-flat as root", () => {
    // E♭3 (51) is the root; the top string must be the eleventh, not a fifth.
    const intervals = guitarVoicing.strings
      .toReversed()
      .map((string) => (((string.midi - 51) % 12) + 12) % 12);
    expect(intervals).toEqual([7, 0, 3, 10, 2, 5]);
  });
});
