import {
  useEffect,
  useEffectEvent,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import {
  createStrings,
  crossedStrings,
  pluckAmplitude,
  stringPath,
  type GuitarLayout,
  type Point,
} from "./string-geometry";
import { createStringMotion } from "./string-motion";
import { cn } from "@/lib/cn";
import { RailAnnotation } from "@/components/blueprint/RailAnnotation";
import "./guitar.css";
import {
  strumStrength,
  type GuitarPluck,
  type GuitarStringsHandle,
} from "./pluck";

const directPluckAmplitude = 4;
// CSS pixels, independent of the SVG's responsive scale.
const dragThreshold = 6;

interface StringGesture {
  id: number;
  point: Point;
  time: number;
  pressClient: Point;
  pluckIndex: number | undefined;
  strumming: boolean;
}

interface Props {
  layout: GuitarLayout;
  className?: string;
  onPluck?: (pluck: GuitarPluck) => void;
  silent?: boolean;
  ref?: Ref<GuitarStringsHandle>;
}

/** Visual instrument with an optional sound adapter; silent by default. */
export function GuitarStrings({
  layout,
  className,
  onPluck,
  silent = true,
  ref,
}: Props) {
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const motion = useRef<ReturnType<typeof createStringMotion> | null>(null);
  const drag = useRef<StringGesture | null>(null);
  const lastPluck = useRef<number[]>([]);
  const [armed, setArmed] = useState(false);
  const strings = useMemo(() => createStrings(layout), [layout]);
  const { hole } = layout;

  useImperativeHandle(
    ref,
    () => ({
      pluck: (index, strength) =>
        motion.current?.pluck(index, 2 + strength * 7, 1),
      reset: () => motion.current?.reset(),
    }),
    [],
  );

  const pluck = (
    index: number,
    amplitude: number,
    direction: number,
    audio?: Pick<GuitarPluck, "strength" | "delay">,
  ) => {
    motion.current?.pluck(index, amplitude, direction);
    onPluck?.({
      index,
      strength: Math.max(0.15, (amplitude - 2) / 7),
      delay: 0,
      ...audio,
    });
  };

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const animation = createStringMotion(element, strings);
    motion.current = animation;
    const events = new AbortController();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const stop = () => {
      const current = drag.current;
      drag.current = null;
      if (current && element.hasPointerCapture(current.id))
        element.releasePointerCapture(current.id);
      setArmed(false);
      animation.reset();
    };
    window.addEventListener("blur", stop, { signal: events.signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop();
      },
      { signal: events.signal },
    );
    reduced.addEventListener(
      "change",
      () => animation.setReduced(reduced.matches),
      { signal: events.signal },
    );
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) stop();
    });
    observer.observe(element);
    element.setAttribute("data-ready", "");
    element.querySelectorAll("[data-guitar-string]").forEach((group) => {
      group.setAttribute("tabindex", "0");
      group.removeAttribute("aria-disabled");
    });
    return () => {
      events.abort();
      observer.disconnect();
      animation.dispose();
      motion.current = null;
      drag.current = null;
    };
  }, [strings]);

  const point = (event: PointerEvent): Point | null => {
    const matrix = svg.current?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
  };

  const release = () => {
    const current = drag.current;
    drag.current = null;
    if (current && svg.current?.hasPointerCapture(current.id))
      svg.current.releasePointerCapture(current.id);
    setArmed(false);
  };

  const movedFromPress = (event: PointerEvent, gesture: StringGesture) =>
    Math.hypot(
      event.clientX - gesture.pressClient.x,
      event.clientY - gesture.pressClient.y,
    ) > dragThreshold;

  const insideViewport = (event: PointerEvent) => {
    // The host may crop the SVG for a narrow layout. Captured pointers must
    // remain in the visible instrument for both strums and release plucks.
    const viewport = svg.current?.parentElement?.getBoundingClientRect();
    return (
      viewport !== undefined &&
      event.clientX >= viewport.left &&
      event.clientX <= viewport.right &&
      event.clientY >= viewport.top &&
      event.clientY <= viewport.bottom
    );
  };

  const move = (event: PointerEvent) => {
    const previous = drag.current;
    if (!previous || previous.id !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      release();
      return;
    }
    const current = point(event);
    if (!current) return;
    if (!insideViewport(event)) {
      release();
      return;
    }
    // Keep the original segment while a click is pending, so crossing a nearby
    // string is not lost when movement becomes a strum. Once started, a strum
    // cannot turn back into a click even if the pointer returns to its origin.
    if (!previous.strumming && !movedFromPress(event, previous)) return;
    const velocity =
      Math.hypot(current.x - previous.point.x, current.y - previous.point.y) /
      Math.max(1, event.timeStamp - previous.time);
    for (const crossing of crossedStrings(previous.point, current, strings)) {
      if (
        event.timeStamp - (lastPluck.current[crossing.index] ?? -Infinity) <
        45
      )
        continue;
      lastPluck.current[crossing.index] = event.timeStamp;
      pluck(crossing.index, pluckAmplitude(velocity), crossing.direction, {
        strength: strumStrength(velocity),
        delay:
          (crossing.fraction * Math.min(40, event.timeStamp - previous.time)) /
          1000,
      });
    }
    drag.current = {
      ...previous,
      point: current,
      time: event.timeStamp,
      strumming: true,
    };
  };

  const cancel = (event: PointerEvent) => {
    if (event.pointerId === drag.current?.id) release();
  };

  const interact = useEffectEvent((event: PointerEvent) => {
    const element = svg.current;
    if (!element) return;
    if (event.type === "pointerdown") {
      if (!event.isPrimary || event.button !== 0 || drag.current) return;
      const current = point(event);
      if (!current) return;
      event.preventDefault();
      element.setPointerCapture(event.pointerId);
      const hit =
        event.target instanceof Element
          ? event.target.closest("[data-guitar-string]")
          : null;
      const string = strings.find(
        ({ index }) =>
          String(index) === hit?.getAttribute("data-guitar-string"),
      );
      drag.current = {
        id: event.pointerId,
        point: current,
        time: event.timeStamp,
        pressClient: { x: event.clientX, y: event.clientY },
        pluckIndex: string?.index,
        strumming: false,
      };
      lastPluck.current = [];
      setArmed(true);
    } else if (event.type === "pointermove") {
      move(event);
    } else if (event.type === "pointerup") {
      const current = drag.current;
      if (!current || event.pointerId !== current.id) return;
      release();
      if (
        !current.strumming &&
        current.pluckIndex !== undefined &&
        !movedFromPress(event, current) &&
        insideViewport(event)
      )
        pluck(current.pluckIndex, directPluckAmplitude, 1);
    } else if (event.type === "pointercancel") {
      cancel(event);
    } else if (
      event.type === "lostpointercapture" &&
      event.target === element
    ) {
      // A child's capture loss can bubble while capture moves to this SVG.
      cancel(event);
    }
  });

  useEffect(() => {
    const element = svg.current;
    if (!element) return;
    const events = new AbortController();
    const handle = (event: PointerEvent) => interact(event);
    // Register on the drawn surface itself: iOS Safari can miss touch input
    // when these handlers are delegated through an Astro island's display:contents.
    for (const type of [
      "pointerdown",
      "pointermove",
      "pointerup",
      "pointercancel",
      "lostpointercapture",
    ] as const)
      element.addEventListener(type, handle, { signal: events.signal });
    return () => events.abort();
  }, []);

  return (
    <figure className={cn("relative m-0", className)}>
      <div data-guitar-viewport="" className="overflow-hidden">
        <svg
          ref={svg}
          data-guitar=""
          data-armed={armed ? "" : undefined}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          height={layout.height}
          className="guitar-strings block h-auto w-full touch-none select-none"
          aria-label="Six guitar strings and a sound hole"
          aria-describedby={`${id}-instructions`}
        >
          <defs>
            <clipPath id={`${id}-hole`}>
              <circle cx={hole.x} cy={hole.y} r={hole.radius} />
            </clipPath>
          </defs>
          <circle
            cx={hole.x}
            cy={hole.y}
            r={hole.radius}
            fill="currentColor"
            fillOpacity=".92"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity=".5"
          />
          <circle
            cx={hole.x}
            cy={hole.y}
            r={hole.radius + 6}
            fill="none"
            stroke="currentColor"
            strokeWidth=".8"
            strokeOpacity=".3"
          />
          {strings.map((string) => (
            <g
              key={string.index}
              data-guitar-string={string.index}
              role="button"
              tabIndex={-1}
              aria-disabled="true"
              aria-label={`Pluck string ${string.index + 1}, ${string.name} (${string.note})`}
              onKeyDown={(event) => {
                if (
                  (event.key === "Enter" || event.key === " ") &&
                  !event.repeat
                ) {
                  event.preventDefault();
                  pluck(string.index, directPluckAmplitude, 1);
                }
              }}
            >
              <path
                data-string-hit=""
                d={stringPath(string)}
                fill="none"
                stroke="transparent"
                strokeWidth="20"
                vectorEffect="non-scaling-stroke"
              />
              <path
                data-string-path=""
                data-string-ink=""
                d={stringPath(string)}
                fill="none"
                stroke="currentColor"
                strokeWidth={string.strokeWidth}
                vectorEffect="non-scaling-stroke"
              />
              <path
                data-string-path=""
                d={stringPath(string)}
                fill="none"
                stroke="var(--color-paper)"
                strokeWidth={string.strokeWidth}
                clipPath={`url(#${id}-hole)`}
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>
      </div>
      <RailAnnotation side="right" align="end" arrowDirection="up">
        <span className="block">Click to pluck</span>
        <span className="block">Drag to strum</span>
      </RailAnnotation>
      <figcaption className="sr-only">
        <span id={`${id}-instructions`}>
          Click to pluck · drag to strum. Keyboard: Tab to a string, then Enter
          or Space to pluck.
        </span>
        <span aria-live="polite">
          {silent
            ? armed
              ? "Strumming · silent"
              : "Visual study · no sound"
            : armed
              ? "Strumming"
              : "Ready to play"}
        </span>
      </figcaption>
    </figure>
  );
}
