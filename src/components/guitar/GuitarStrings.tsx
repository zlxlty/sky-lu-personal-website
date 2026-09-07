import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
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

const directPluckAmplitude = 4;

interface Props {
  layout: GuitarLayout;
  className?: string;
}

/** Silent visual instrument; audio will connect to plucks in the next candidate. */
export function GuitarStrings({ layout, className }: Props) {
  const id = useId();
  const svg = useRef<SVGSVGElement>(null);
  const motion = useRef<ReturnType<typeof createStringMotion> | null>(null);
  const drag = useRef<{ id: number; point: Point; time: number } | null>(null);
  const lastPluck = useRef<number[]>([]);
  const [armed, setArmed] = useState(false);
  const strings = useMemo(() => createStrings(layout), [layout]);
  const { hole } = layout;

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

  const point = (event: PointerEvent<SVGSVGElement>): Point | null => {
    const matrix = event.currentTarget.getScreenCTM();
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

  const move = (event: PointerEvent<SVGSVGElement>) => {
    const previous = drag.current;
    if (!previous || previous.id !== event.pointerId) return;
    if (!(event.buttons & 1)) {
      release();
      return;
    }
    const current = point(event);
    if (!current) return;
    // The host may crop the SVG for a narrow layout. End the gesture at the
    // visible viewport, rather than letting a captured pointer strum offscreen.
    const viewport = event.currentTarget.parentElement?.getBoundingClientRect();
    if (
      !viewport ||
      event.clientX < viewport.left ||
      event.clientX > viewport.right ||
      event.clientY < viewport.top ||
      event.clientY > viewport.bottom
    ) {
      release();
      return;
    }
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
      motion.current?.pluck(
        crossing.index,
        pluckAmplitude(velocity),
        crossing.direction,
      );
    }
    drag.current = { ...previous, point: current, time: event.timeStamp };
  };

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
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0 || drag.current) return;
            const current = point(event);
            if (!current) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            drag.current = {
              id: event.pointerId,
              point: current,
              time: event.timeStamp,
            };
            // Pluck on press so both mouse clicks and touch taps feel immediate.
            // Pointer capture keeps the ensuing drag on the shared strum path;
            // release never plucks again.
            const hit =
              event.target instanceof Element
                ? event.target.closest("[data-guitar-string]")
                : null;
            const string = strings.find(
              ({ index }) =>
                String(index) === hit?.getAttribute("data-guitar-string"),
            );
            if (string) {
              lastPluck.current[string.index] = event.timeStamp;
              motion.current?.pluck(string.index, directPluckAmplitude, 1);
            }
            setArmed(true);
          }}
          onPointerMove={move}
          onPointerUp={(event) => {
            if (event.pointerId === drag.current?.id) release();
          }}
          onPointerCancel={release}
          onLostPointerCapture={release}
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
              aria-label={`Pluck string ${string.index + 1}, ${string.name}`}
              onKeyDown={(event) => {
                if (
                  (event.key === "Enter" || event.key === " ") &&
                  !event.repeat
                ) {
                  event.preventDefault();
                  motion.current?.pluck(string.index, directPluckAmplitude, 1);
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
          {armed ? "Strumming · silent" : "Visual study · no sound"}
        </span>
      </figcaption>
    </figure>
  );
}
