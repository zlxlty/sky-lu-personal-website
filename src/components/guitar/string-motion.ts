import { stringPath, type GuitarString } from "./string-geometry";

/** One on-demand loop for all six strings. React never receives frame updates. */
export function createStringMotion(
  svg: SVGSVGElement,
  strings: readonly GuitarString[],
) {
  const groups = Array.from(
    svg.querySelectorAll<SVGGElement>("[data-guitar-string]"),
  );
  const paths = groups.map((group) =>
    Array.from(group.querySelectorAll<SVGPathElement>("[data-string-path]")),
  );
  const resting = strings.map((string) => stringPath(string));
  const active = new Map<
    number,
    { start: number; amplitude: number; direction: number }
  >();
  let frame = 0;
  let reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const restore = (index: number) => {
    groups[index]?.removeAttribute("data-vibrating");
    for (const path of paths[index] ?? [])
      path.setAttribute("d", resting[index] ?? "");
  };

  const tick = (now: number) => {
    frame = 0;
    for (const [index, pluck] of active) {
      const elapsed = (now - pluck.start) / 1000;
      const amplitude = pluck.amplitude * Math.exp(-5.5 * elapsed);
      const string = strings[index];
      if (!string || amplitude < 0.06 || (reduced && elapsed > 0.16)) {
        restore(index);
        active.delete(index);
        continue;
      }
      if (!reduced) {
        const displacement =
          amplitude *
          Math.sin(elapsed * Math.PI * 2 * (11 - index * 0.9)) *
          pluck.direction;
        const d = stringPath(string, displacement);
        for (const path of paths[index] ?? []) path.setAttribute("d", d);
      }
    }
    if (active.size) frame = requestAnimationFrame(tick);
    else svg.removeAttribute("data-animating");
  };

  const reset = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    active.clear();
    strings.forEach((_, index) => restore(index));
    svg.removeAttribute("data-animating");
  };

  return {
    pluck(index: number, amplitude: number, direction: number) {
      active.set(index, { start: performance.now(), amplitude, direction });
      groups[index]?.setAttribute("data-vibrating", "");
      svg.setAttribute("data-animating", "");
      if (!frame) frame = requestAnimationFrame(tick);
    },
    setReduced(value: boolean) {
      reduced = value;
      reset();
    },
    reset,
    dispose: reset,
  };
}
