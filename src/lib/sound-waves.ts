import { followRecord } from "./record-spectrum";
import { bandCount } from "./spectrum-bands";
import { readSpectrum } from "./spectrum-sources";

/** How one page's waves look and move. */
export interface WaveSettings {
  /** Pixels the lowest thread rises at full size. */
  height: number;
  /** Pixels from where the waves gather to where they end on the right, at most. */
  spread: number;
  /** Pixels from the copy's left edge to where the waves gather. */
  gather: number;
  /** Threads drawn around the base line, from the lowest register to the highest. */
  threads: number;
  opacity: number;
  /** Line width in pixels. */
  weight: number;
  /** Share of full size the threads keep in silence, so the line is never dead. */
  idle: number;
  /** How fast the waves drift along the line. */
  speed: number;
  /** Seconds a thread takes to cover most of the way up to a louder register. */
  rise: number;
  /** Seconds it takes to cover most of the way back down. */
  fall: number;
  /** Scales what is heard before it moves the threads. */
  sensitivity: number;
}

/** The homepage hero's waves. Other pages override what differs. */
export const heroWaves: WaveSettings = {
  height: 20,
  spread: 300,
  gather: 125,
  threads: 5,
  opacity: 0.6,
  weight: 1,
  idle: 0.4,
  speed: 1,
  rise: 0.4,
  fall: 0.6,
  sensitivity: 1,
};
export const maxThreads = 9;

/** Settings from a `data-waves` attribute: the hero's, with any overrides. */
export function waveSettings(json: string | undefined): WaveSettings {
  const settings = { ...heroWaves };
  try {
    const overrides = JSON.parse(json ?? "{}") as Partial<
      Record<keyof WaveSettings, unknown>
    >;
    for (const key of Object.keys(heroWaves) as (keyof WaveSettings)[]) {
      const value = overrides[key];
      if (typeof value === "number" && Number.isFinite(value))
        settings[key] = value;
    }
  } catch {
    // Unreadable overrides leave the hero's settings.
  }
  settings.threads = Math.min(
    maxThreads,
    Math.max(1, Math.round(settings.threads)),
  );
  return settings;
}

const tau = Math.PI * 2;

/** What the waves remember between frames, kept apart from the canvas. */
export interface WaveMotion {
  /** Band levels with frame-to-frame jitter removed. */
  readonly levels: Float32Array;
  /** Each thread's first step toward its register, which `sizes` then follows. */
  readonly leads: Float32Array;
  /** Each thread's size from 0 to 1, as its register sounds. */
  readonly sizes: Float32Array;
  clock: number;
}

export function createWaveMotion(): WaveMotion {
  return {
    levels: new Float32Array(bandCount),
    leads: new Float32Array(maxThreads),
    sizes: new Float32Array(maxThreads),
    clock: 0,
  };
}

const ease = (
  from: number,
  to: number,
  seconds: number,
  up: number,
  down: number,
) => from + (to - from) * (1 - Math.exp(-seconds / (to > from ? up : down)));

/** Advance toward what is `heard`: band levels from 0 to 1. */
export function stepWaves(
  motion: WaveMotion,
  heard: Float32Array,
  seconds: number,
  settings: WaveSettings,
) {
  const { levels, leads, sizes } = motion;
  const { threads, rise, fall, sensitivity } = settings;
  for (let band = 0; band < bandCount; band++)
    levels[band] = ease(
      levels[band] ?? 0,
      heard[band] ?? 0,
      seconds,
      0.015,
      0.06,
    );
  for (let thread = 0; thread < threads; thread++) {
    // Each thread follows one register: an equal slice of the bands.
    const from = Math.floor((thread * bandCount) / threads);
    const to = Math.floor(((thread + 1) * bandCount) / threads);
    let sum = 0;
    for (let band = from; band < to; band++) sum += levels[band] ?? 0;
    // Two short steps in a row start from rest, speed up, then settle, and
    // arrive about when one step of the full length would. A single step
    // moves fastest in its first instant, which reads as a jump on each note.
    leads[thread] = ease(
      leads[thread] ?? 0,
      Math.min(1, (sum / (to - from)) * sensitivity),
      seconds,
      0.6 * rise,
      0.6 * fall,
    );
    sizes[thread] = ease(
      sizes[thread] ?? 0,
      leads[thread] ?? 0,
      seconds,
      0.6 * rise,
      0.6 * fall,
    );
  }
  motion.clock += seconds * settings.speed;
}

/** Where a thread sits between the lowest register (0) and the highest (1). */
const share = (thread: number, { threads }: WaveSettings) =>
  threads === 1 ? 0 : thread / (threads - 1);

/** Pixels a thread can rise right now; silence leaves a slow breath. */
function threadScale(
  motion: WaveMotion,
  thread: number,
  settings: WaveSettings,
) {
  const size = motion.sizes[thread] ?? 0;
  const breath =
    settings.idle * (0.3 + 0.12 * Math.sin(motion.clock * 0.6 + thread * 1.9));
  return (
    settings.height *
    (1 - 0.4 * share(thread, settings)) *
    // Sound adds to the ripple from a note's first moment. Showing the larger
    // of the two hid a note until it outgrew the ripple, then took over.
    (breath + size * (1 - breath))
  );
}

/** Opacity of a thread's line: higher registers are fainter, tiny waves fade out. */
export function threadAlpha(
  motion: WaveMotion,
  thread: number,
  settings: WaveSettings,
) {
  const scale = threadScale(motion, thread, settings);
  return scale < 0.35
    ? 0
    : settings.opacity *
        (1 - 0.7 * share(thread, settings)) *
        Math.min(1, scale / 3);
}

/**
 * Pixels a thread sits above the base line at `x`. Both `x` and `center`, where
 * the waves gather, are measured from the left rail. Waves vanish at the rail
 * and `reach` pixels right of the centre.
 */
export function threadOffset(
  motion: WaveMotion,
  thread: number,
  x: number,
  center: number,
  reach: number,
  settings: WaveSettings,
) {
  const offset = x - center;
  const u = offset / (offset < 0 ? Math.min(center, reach) : reach);
  if (Math.abs(u) >= 1) return 0;
  const high = share(thread, settings);
  const wavelength = 170 - 110 * high;
  const phase = motion.clock * (1.4 + 2.2 * high) + thread * 2.1;
  return (
    threadScale(motion, thread, settings) *
    (1 - u * u) ** 2 *
    Math.sin((tau * x) / wavelength - phase)
  );
}

/** Draws whatever the page is playing as waves on a base line between the rails. */
class SoundWaves extends HTMLElement {
  static observedAttributes = ["data-waves"];
  #settings = heroWaves;
  #canvas: HTMLCanvasElement | null = null;
  #motion = createWaveMotion();
  #heard = new Float32Array(bandCount);
  #events?: AbortController;
  #visible = false;
  #reduced = matchMedia("(prefers-reduced-motion: reduce)");
  #frame = 0;
  #last = 0;
  #width = 0;
  #center = 0;
  #reach = 0;
  #fade?: CanvasGradient;

  connectedCallback() {
    if (this.#events && !this.#events.signal.aborted) return;
    this.#canvas = this.querySelector("canvas");
    if (!this.#canvas) return;
    this.#events = new AbortController();
    const { signal } = this.#events;
    let spectra: Record<string, string> = {};
    try {
      spectra = JSON.parse(this.dataset.spectra ?? "{}") as typeof spectra;
    } catch {
      // Without the map the record is simply not drawn.
    }
    followRecord(spectra, signal);
    // The canvas spans the hero, so it reports every change of width.
    const sizes = new ResizeObserver(this.#layout);
    sizes.observe(this.#canvas);
    const theme = new MutationObserver(this.#layout);
    theme.observe(document.documentElement, {
      attributeFilter: ["data-theme"],
    });
    const sight = new IntersectionObserver(([entry]) => {
      this.#visible = entry?.isIntersecting ?? false;
      this.#wake();
    });
    sight.observe(this.#canvas);
    this.#reduced.addEventListener("change", this.#wake, { signal });
    signal.addEventListener("abort", () => {
      sizes.disconnect();
      theme.disconnect();
      sight.disconnect();
    });
    this.#layout();
  }

  attributeChangedCallback() {
    this.#settings = waveSettings(this.dataset.waves);
    this.#layout();
  }

  disconnectedCallback() {
    if (this.isConnected) return;
    this.#events?.abort();
    cancelAnimationFrame(this.#frame);
    this.#frame = 0;
    this.#visible = false;
  }

  #layout = () => {
    const canvas = this.#canvas;
    if (!canvas) return;
    const ratio = devicePixelRatio;
    const { height, weight, gather, spread } = this.#settings;
    // Room for the tallest wave either side of the line, on whole pixels.
    canvas.style.height = `${2 * Math.ceil(height + weight + 2)}px`;
    // Rest the base line on whole device pixels, as crisp as the rails.
    this.style.removeProperty("--wave-snap");
    const top = this.getBoundingClientRect().top + scrollY;
    this.style.setProperty(
      "--wave-snap",
      `${Math.round(top * ratio) / ratio - top}px`,
    );
    const box = canvas.getBoundingClientRect();
    this.#width = box.width;
    this.#center = this.getBoundingClientRect().left - box.left + gather;
    // On a narrow screen the waves end at the right rail.
    this.#reach = Math.min(spread, box.width - this.#center);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    // Lines fade out toward both ends, so flat stretches never thicken the base line.
    const context = canvas.getContext("2d");
    const [red = 0, green = 0, blue = 0] =
      getComputedStyle(this).color.match(/[\d.]+/g) ?? [];
    const end = this.#center + this.#reach;
    const fade = context?.createLinearGradient(0, 0, end, 0);
    const clear = `rgb(${red} ${green} ${blue} / 0)`;
    const solid = `rgb(${red} ${green} ${blue})`;
    fade?.addColorStop(0, clear);
    fade?.addColorStop(Math.min(0.4, (this.#center * 0.6) / end), solid);
    fade?.addColorStop(0.6, solid);
    fade?.addColorStop(1, clear);
    this.#fade = fade;
  };

  #wake = () => {
    if (this.#reduced.matches) {
      // Reduced motion keeps the base line and nothing else.
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
      this.#canvas
        ?.getContext("2d")
        ?.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
      return;
    }
    if (this.#frame || !this.#visible) return;
    this.#last = performance.now();
    this.#frame = requestAnimationFrame(this.#draw);
  };

  #draw = (now: number) => {
    this.#frame = 0;
    const context = this.#canvas?.getContext("2d");
    if (!context || !this.#canvas || !this.#fade) return;
    // A background tab or a long task must not fling the waves.
    const seconds = Math.min(0.05, (now - this.#last) / 1000);
    this.#last = now;
    readSpectrum(this.#heard);
    const settings = this.#settings;
    stepWaves(this.#motion, this.#heard, seconds, settings);

    const ratio = devicePixelRatio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, this.#width, this.#canvas.height);
    context.lineWidth = settings.weight;
    context.lineJoin = "round";
    context.strokeStyle = this.#fade;
    // The canvas is centred on the base line's own row of pixels.
    const base = this.#canvas.height / ratio / 2 + 0.5;
    const end = this.#center + this.#reach;
    for (let thread = settings.threads - 1; thread >= 0; thread--) {
      const alpha = threadAlpha(this.#motion, thread, settings);
      if (!alpha) continue;
      context.beginPath();
      context.moveTo(0, base);
      for (let x = 0; x <= end; x += 2)
        context.lineTo(
          x,
          base -
            threadOffset(
              this.#motion,
              thread,
              x,
              this.#center,
              this.#reach,
              settings,
            ),
        );
      context.globalAlpha = alpha;
      context.stroke();
    }
    context.globalAlpha = 1;
    if (this.#visible && !this.#reduced.matches)
      this.#frame = requestAnimationFrame(this.#draw);
  };
}

if (!customElements.get("sound-waves"))
  customElements.define("sound-waves", SoundWaves);
