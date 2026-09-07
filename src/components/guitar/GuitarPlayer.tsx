import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GuitarStrings } from "./GuitarStrings";
import { createGuitarAudio } from "./audio/guitar-audio";
import { createStrings, type GuitarLayout } from "./string-geometry";
import type { GuitarStringsHandle } from "./pluck";
import { guitarVoicing } from "./voicing";

const noteNames = guitarVoicing.strings.map((string) =>
  string.note.replace(/\d+$/, ""),
);
type SoundPhase = "off" | "loading" | "ready" | "error";
const soundAction: Record<SoundPhase, string> = {
  off: "Enable sound",
  loading: "Cancel loading",
  ready: "Mute sound",
  error: "Retry sound",
};
// Keep the control disabled in server HTML without an effect-driven render.
const subscribeToHydration = () => () => undefined;
const clientSnapshot = () => true;
const serverSnapshot = () => false;

interface Props {
  layout: GuitarLayout;
  className?: string;
}

/** One homepage island; sound and the selected recordings load only on request. */
export function GuitarPlayer({ layout, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<HTMLDivElement>(null);
  const guitar = useRef<GuitarStringsHandle>(null);
  const audio = useRef<ReturnType<typeof createGuitarAudio> | null>(null);
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    clientSnapshot,
    serverSnapshot,
  );
  const [phase, setPhase] = useState<SoundPhase>("off");

  useEffect(() => {
    const element = host.current;
    const column = controls.current;
    const svg = element?.querySelector<SVGSVGElement>("[data-guitar]");
    const viewport = svg?.parentElement;
    const button = column?.querySelector("button");
    const first = createStrings(layout)[0];
    if (!element || !column || !svg || !viewport || !button || !first) return;

    const align = () => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      // Measure the resting string, never its animated path. The SVG transform
      // includes scaling and mobile cropping; CSS centers the notes in the gap.
      const from = new DOMPoint(first.from.x, first.from.y).matrixTransform(
        matrix,
      );
      const to = new DOMPoint(first.to.x, first.to.y).matrixTransform(matrix);
      const bounds = column.getBoundingClientRect();
      const x = Math.min(
        bounds.left + bounds.width / 2,
        viewport.getBoundingClientRect().right,
      );
      const stringY =
        from.y + ((to.y - from.y) * (x - from.x)) / (to.x - from.x);
      column.style.setProperty(
        "--guitar-controls-height",
        `${Math.max(button.getBoundingClientRect().height, stringY - bounds.top)}px`,
      );
    };
    const observer = new ResizeObserver(align);
    observer.observe(svg);
    observer.observe(element);
    align();
    return () => observer.disconnect();
  }, [layout]);

  useEffect(() => {
    const events = new AbortController();
    const stop = () => {
      audio.current?.stop();
      guitar.current?.reset();
    };
    const close = () => {
      stop();
      audio.current?.dispose();
      audio.current = null;
      setPhase("off");
    };
    window.addEventListener("blur", stop, { signal: events.signal });
    window.addEventListener("pagehide", close, { signal: events.signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop();
      },
      { signal: events.signal },
    );
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) stop();
    });
    if (host.current) observer.observe(host.current);
    return () => {
      events.abort();
      observer.disconnect();
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);

  async function toggle() {
    if (audio.current) {
      audio.current.dispose();
      audio.current = null;
      setPhase("off");
      return;
    }
    let engine: ReturnType<typeof createGuitarAudio>;
    try {
      // Unlock synchronously in this gesture, before awaiting the bank module.
      engine = createGuitarAudio();
    } catch {
      setPhase("error");
      return;
    }
    audio.current = engine;
    engine.setVolume(0.65);
    setPhase("loading");
    try {
      const { quartertoneBank } = await import("./audio/quartertone-bank");
      if (audio.current !== engine) return;
      await engine.load(quartertoneBank);
      if (audio.current === engine) setPhase("ready");
    } catch {
      engine.dispose();
      if (audio.current === engine) {
        audio.current = null;
        setPhase("error");
      }
    }
  }

  return (
    <div
      ref={host}
      data-guitar-player=""
      data-audio-state={phase}
      className="relative md:static"
    >
      <GuitarStrings
        ref={guitar}
        layout={layout}
        className={className}
        silent={phase !== "ready"}
        onPluck={(event) => {
          void audio.current?.pluck(event);
        }}
      />
      <div
        ref={controls}
        data-guitar-sound-controls=""
        className="pointer-events-none absolute top-1.5 right-1.5 z-20 h-[var(--guitar-controls-height,65%)] w-11"
      >
        <div
          role="group"
          aria-label="Guitar sound"
          className="flex h-full flex-col items-center font-mono text-xs text-(--color-blueprint-rule)"
        >
          <button
            type="button"
            onClick={() => {
              void toggle();
            }}
            disabled={!hydrated}
            aria-label={soundAction[phase]}
            title={soundAction[phase]}
            aria-pressed={phase === "ready"}
            className="pointer-events-auto inline-flex size-11 shrink-0 cursor-pointer items-center justify-center disabled:cursor-default disabled:opacity-45"
          >
            <svg
              data-guitar-sound-icon=""
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={
                phase === "loading"
                  ? "animate-spin text-foreground opacity-45 motion-reduce:animate-none"
                  : "text-foreground opacity-45"
              }
            >
              {phase === "loading" ? (
                <>
                  <circle cx="12" cy="12" r="8" opacity=".25" />
                  <path d="M12 4a8 8 0 0 1 8 8" />
                </>
              ) : phase === "error" ? (
                <>
                  <path d="M20 8a8 8 0 1 0 0 8M20 3v5h-5" />
                </>
              ) : (
                <>
                  <path d="M11 5 6 9H3v6h3l5 4Z" />
                  {phase === "ready" ? (
                    <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
                  ) : (
                    <path d="m16 9 5 6m0-6-5 6" />
                  )}
                </>
              )}
            </svg>
          </button>
          <div className="flex min-h-0 flex-1 items-center">
            <ol
              data-guitar-notes=""
              aria-label="Guitar notes, high to low"
              className="m-0 flex -translate-y-2 list-none flex-col items-center gap-1 p-0 leading-4 sm:-translate-y-3 sm:gap-2 sm:leading-5"
            >
              {noteNames.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ol>
          </div>
        </div>
        <p
          role="status"
          className={
            phase === "error"
              ? "absolute top-3 right-full m-0 mr-2 w-40 text-right text-xs"
              : "sr-only"
          }
        >
          {phase === "error"
            ? "Sound could not load. You can try again."
            : phase === "loading"
              ? "Loading guitar sound."
              : phase === "ready"
                ? "Guitar sound enabled."
                : "Guitar sound off."}
        </p>
      </div>
    </div>
  );
}
