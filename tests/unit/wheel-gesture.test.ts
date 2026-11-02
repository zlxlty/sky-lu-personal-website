import { describe, expect, it } from "vitest";
import {
  NO_WHEEL_GESTURE,
  WHEEL_GESTURE_GAP_MS,
  nextWheelGesture,
  type WheelGesture,
} from "@/lib/wheel-gesture";

/** Replay [timeStamp, timeline can take it] events and report who owned each. */
const timelineOwned = (events: ReadonlyArray<readonly [number, boolean]>) => {
  let gesture: WheelGesture = NO_WHEEL_GESTURE;
  return events.map(([timeStamp, timelineCanTake]) => {
    gesture = nextWheelGesture(gesture, timeStamp, timelineCanTake);
    return gesture.timelineOwns;
  });
};

describe("wheel gestures", () => {
  it("keeps a flick on the timeline after it reaches an end, until a pause", () => {
    expect(
      timelineOwned([
        [1000, true],
        [1016, true],
        [1032, false],
        [1032 + WHEEL_GESTURE_GAP_MS, false],
        [1033 + 2 * WHEEL_GESTURE_GAP_MS, false],
      ]),
    ).toEqual([true, true, true, true, false]);
  });

  it("gives the page a gesture that starts at an end, even if it turns back", () => {
    expect(
      timelineOwned([
        [1000, false],
        [1016, true],
        [1032, true],
      ]),
    ).toEqual([false, false, false]);
  });

  it("lets the first event after a pause decide again", () => {
    expect(
      timelineOwned([
        [0, false],
        [1 + WHEEL_GESTURE_GAP_MS, true],
      ]),
    ).toEqual([false, true]);
  });
});
