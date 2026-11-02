/**
 * A pause this long between wheel events ends one scroll gesture. It is longer
 * than the gaps inside one flick (about 17 ms, at most 26 ms in Chromium tests),
 * and was chosen by hand on a trackpad so a new scroll feels immediate.
 */
export const WHEEL_GESTURE_GAP_MS = 50;

export interface WheelGesture {
  /** `timeStamp` of the latest wheel event. */
  readonly lastEventAt: number;
  /** Whether the timeline, rather than the page, owns the current gesture. */
  readonly timelineOwns: boolean;
}

export const NO_WHEEL_GESTURE: WheelGesture = {
  lastEventAt: Number.NEGATIVE_INFINITY,
  timelineOwns: false,
};

/** Advance the gesture by one wheel event. */
export function nextWheelGesture(
  gesture: WheelGesture,
  timeStamp: number,
  timelineCanTake: boolean,
): WheelGesture {
  const startsGesture = timeStamp - gesture.lastEventAt > WHEEL_GESTURE_GAP_MS;
  return {
    lastEventAt: timeStamp,
    timelineOwns: startsGesture ? timelineCanTake : gesture.timelineOwns,
  };
}
