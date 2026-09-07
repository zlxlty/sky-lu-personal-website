import { useCallback, useEffect, useRef, useState } from "react";
import { GuitarStrings } from "@/components/guitar/GuitarStrings";
import type {
  GuitarPluck,
  GuitarStringsHandle,
} from "@/components/guitar/pluck";
import { createGuitarAudio } from "@/components/guitar/audio/guitar-audio";
import { guitarBanks, guitarBankDescriptions } from "./guitar-samples";
import { guitarVoicing } from "@/components/guitar/voicing";

const layout = {
  width: 800,
  height: 360,
  hole: { x: 420, y: 180, radius: 112 },
  angle: 35,
  length: 1400,
  spacing: 22,
};
const noteButtons = guitarVoicing.strings.toReversed();
const fingering = noteButtons.map((string) => string.fret).join("–");
const button =
  "min-h-11 rounded border border-(--color-blueprint-rule) px-4 py-2 text-sm transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-45";

/** Development comparison. The homepage imports only the selected Yamaha bank. */
export function GuitarAudition() {
  const audio = useRef<ReturnType<typeof createGuitarAudio> | null>(null);
  const guitar = useRef<GuitarStringsHandle>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const referencePlaying = useRef(false);
  const [selected, setSelected] = useState("quartertone");
  const [phase, setPhase] = useState<"off" | "loading" | "ready" | "error">(
    "off",
  );
  const [playing, setPlaying] = useState(false);
  const [strength, setStrength] = useState(0.6);
  const [volume, setVolume] = useState(0.65);
  const description = guitarBankDescriptions.find(
    (bank) => bank.id === selected,
  );

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    referencePlaying.current = false;
    setPlaying(false);
    audio.current?.stop();
    guitar.current?.reset();
  }, []);

  useEffect(() => {
    const events = new AbortController();
    window.addEventListener("blur", stop, { signal: events.signal });
    window.addEventListener("pagehide", stop, { signal: events.signal });
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) stop();
      },
      { signal: events.signal },
    );
    return () => {
      events.abort();
      timers.current.forEach(clearTimeout);
      audio.current?.dispose();
      audio.current = null;
    };
  }, [stop]);

  async function load(
    id: string,
    engine: ReturnType<typeof createGuitarAudio>,
  ) {
    const bank = guitarBanks.find((candidate) => candidate.id === id);
    if (!bank) return;
    setPhase("loading");
    try {
      await engine.load(bank);
      if (audio.current === engine) setPhase("ready");
    } catch {
      if (audio.current === engine) {
        engine.dispose();
        audio.current = null;
        setPhase("error");
      }
    }
  }

  function toggleSound() {
    if (audio.current) {
      stop();
      audio.current.dispose();
      audio.current = null;
      setPhase("off");
      return;
    }
    try {
      const engine = createGuitarAudio();
      audio.current = engine;
      engine.setVolume(volume);
      void load(selected, engine);
    } catch {
      setPhase("error");
    }
  }

  function choose(id: string) {
    stop();
    setSelected(id);
    if (audio.current) void load(id, audio.current);
  }

  const onPluck = (event: GuitarPluck) => {
    if (referencePlaying.current) {
      stop();
      guitar.current?.pluck(event.index, event.strength);
    }
    void audio.current?.pluck(event);
  };

  function playPhrase() {
    stop();
    referencePlaying.current = true;
    setPlaying(true);
    // Six isolated notes, then a down/up strum. Identical for every library.
    const events: GuitarPluck[] = [
      ...[5, 4, 3, 2, 1, 0].map((index, i) => ({
        index,
        strength,
        delay: i * 0.3,
      })),
      ...[5, 4, 3, 2, 1, 0].map((index, i) => ({
        index,
        strength,
        delay: 2.2 + i * 0.035,
      })),
      ...[0, 1, 2, 3, 4, 5].map((index, i) => ({
        index,
        strength,
        delay: 3.4 + i * 0.035,
      })),
    ];
    for (const event of events) {
      void audio.current?.pluck(event);
      timers.current.push(
        setTimeout(
          () => guitar.current?.pluck(event.index, event.strength),
          event.delay * 1000,
        ),
      );
    }
    timers.current.push(
      setTimeout(() => {
        referencePlaying.current = false;
        setPlaying(false);
      }, 4200),
    );
  }

  return (
    <div data-guitar-audition="" data-audio-state={phase}>
      <fieldset
        className="m-0 grid gap-3 border-0 p-0 sm:grid-cols-2"
        disabled={phase === "loading"}
      >
        <legend className="sr-only">Choose the guitar recording</legend>
        {guitarBankDescriptions.map((bank) => (
          <label
            key={bank.id}
            className={`flex cursor-pointer items-start gap-3 rounded border p-4 ${selected === bank.id ? "bg-accent/40 border-current" : "border-(--color-blueprint-rule)"}`}
          >
            <input
              type="radio"
              name="guitar-bank"
              value={bank.id}
              checked={selected === bank.id}
              onChange={() => choose(bank.id)}
              className="mt-1 accent-current"
            />
            <span>
              <span className="block font-heading text-base">{bank.label}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {bank.detail}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={phase === "ready" || phase === "loading"}
          className={button}
        >
          {phase === "loading"
            ? "Cancel loading"
            : phase === "ready"
              ? "Mute sound"
              : "Enable sound"}
        </button>
        <p role="status" className="m-0 text-xs text-muted-foreground">
          {phase === "loading"
            ? "Loading recordings…"
            : phase === "ready"
              ? "Ready · click a string or drag to strum"
              : phase === "error"
                ? "Audio could not load. Try enabling sound again."
                : "Sound is off. Enable it to listen."}
        </p>
      </div>

      <GuitarStrings
        ref={guitar}
        layout={layout}
        onPluck={onPluck}
        silent={phase !== "ready"}
        className="my-5"
      />

      <div
        className="grid grid-cols-3 gap-2 sm:grid-cols-6"
        aria-label="Individual notes"
      >
        {noteButtons.map((note) => (
          <button
            key={note.index}
            type="button"
            className={`${button} font-mono`}
            disabled={phase !== "ready"}
            aria-label={`Play string ${note.index + 1}, ${note.note}`}
            onClick={() => {
              stop();
              guitar.current?.pluck(note.index, strength);
              void audio.current?.pluck({
                index: note.index,
                strength,
                delay: 0,
              });
            }}
          >
            {note.note}
          </button>
        ))}
      </div>
      <p className="mt-3 mb-0 text-xs text-muted-foreground">
        <span className="font-mono">
          {guitarVoicing.name} · {fingering}
        </span>
        {" · Frets, low to high · standard tuning"}
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={button}
          disabled={phase !== "ready"}
          onClick={playPhrase}
        >
          {playing ? "Replay comparison phrase" : "Play comparison phrase"}
        </button>
        <button
          type="button"
          className={button}
          disabled={phase !== "ready"}
          onClick={stop}
        >
          Stop
        </button>
        <span className="text-xs text-muted-foreground">
          Six plucks, then down / up.
        </span>
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-xs">
          Note / phrase strength ·{" "}
          {strength < 0.35 ? "Soft" : strength < 0.8 ? "Medium" : "Firm"}
          <input
            type="range"
            min="0.15"
            max="1"
            step="0.01"
            value={strength}
            onChange={(e) => setStrength(Number(e.target.value))}
            className="mt-3 block w-full accent-current"
          />
        </label>
        <label className="text-xs">
          Listening volume · {Math.round(volume * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => {
              const value = Number(e.target.value);
              setVolume(value);
              audio.current?.setVolume(value);
            }}
            className="mt-3 block w-full accent-current"
          />
        </label>
      </div>
      <p className="mt-6 mb-0 text-xs leading-relaxed text-muted-foreground">
        Recordings with a whole-library level trim. No reverb. Drag speed
        controls plucking strength.
        {description && (
          <>
            {" "}
            Source:{" "}
            <a
              className="underline underline-offset-4"
              href={description.source}
              target="_blank"
              rel="noreferrer"
            >
              {description.name}
            </a>{" "}
            ·{" "}
            {description.licenseUrl ? (
              <a
                className="underline underline-offset-4"
                href={description.licenseUrl}
                target="_blank"
                rel="noreferrer"
              >
                {description.license}
              </a>
            ) : (
              description.license
            )}
            .{description.preparation && <> {description.preparation}</>}
          </>
        )}
      </p>
    </div>
  );
}
