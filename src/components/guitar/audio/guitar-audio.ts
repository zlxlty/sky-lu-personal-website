import type { ToneBufferSource } from "tone";
import type { GuitarPluck } from "../pluck";
import {
  playbackRate,
  sampleChoices,
  type GuitarSampleBank,
} from "./sample-bank";

let toneModule: Promise<typeof import("tone")> | undefined;
function loadTone() {
  return (toneModule ??= import("tone")
    .then((Tone) => {
      // Tone's public entry point creates a default context at import time.
      // Release it even if activation was cancelled while the chunk loaded;
      // every engine instead uses the context unlocked by its own user gesture.
      Tone.getContext().dispose();
      return Tone;
    })
    .catch((error: unknown) => {
      toneModule = undefined;
      throw error;
    }));
}

/** Call directly from sound activation: unlock before any import or fetch awaits. */
export function createGuitarAudio() {
  const raw = new AudioContext({ latencyHint: "interactive" });
  const unlocked = raw.resume();
  const downloads = new AbortController();
  const buffers = new Map<string, Promise<AudioBuffer>>();
  const voices = new Map<ToneBufferSource, number>();
  const lastVoice = new Map<number, ToneBufferSource>();
  const takes = new Map<string, number>();
  let bank: GuitarSampleBank | undefined;
  let disposed = false;
  let volume = 0.65;
  let generation = 0;
  const ready = Promise.all([loadTone(), unlocked]).then(([Tone]) => {
    if (disposed) throw new DOMException("Audio closed", "AbortError");
    const context = new Tone.Context({
      context: raw,
      lookAhead: 0.005,
      updateInterval: 0.01,
    });
    // The guitar is the only Tone owner. Nodes also consult this global while
    // resolving constructor defaults, even when given an explicit context.
    Tone.setContext(context, true);
    const limiter = new Tone.Limiter({
      context,
      threshold: -2,
    }).toDestination();
    const gain = new Tone.Gain({ context, gain: volume }).connect(limiter);
    return { Tone, context, gain, limiter };
  });

  const stop = () => {
    generation++;
    for (const [voice, when] of voices) {
      if (when > raw.currentTime) {
        voice.dispose();
        voices.delete(voice);
      } else voice.stop(raw.currentTime);
    }
    lastVoice.clear();
  };

  return {
    async load(next: GuitarSampleBank) {
      stop();
      bank = undefined;
      await ready;
      await Promise.all(
        next.samples.map((sample) => {
          let pending = buffers.get(sample.url);
          if (!pending) {
            pending = fetch(sample.url, { signal: downloads.signal })
              .then((response) => {
                if (!response.ok)
                  throw new Error("A guitar sample could not be loaded.");
                return response.arrayBuffer();
              })
              .then((bytes) => raw.decodeAudioData(bytes))
              .catch((error: unknown) => {
                buffers.delete(sample.url);
                throw error;
              });
            buffers.set(sample.url, pending);
          }
          return pending;
        }),
      );
      if (!disposed) bank = next;
    },
    async pluck({ index, strength, delay }: GuitarPluck) {
      const requestedGeneration = generation;
      const current = bank;
      if (!current || disposed || raw.state !== "running") return;
      const { Tone, context, gain } = await ready;
      const choices = sampleChoices(current, index, strength);
      const key = `${current.id}:${index}:${choices[0]?.low}`;
      const take = takes.get(key) ?? 0;
      const sample = choices[take % choices.length];
      if (!sample) return;
      takes.set(key, take + 1);
      const buffer = await buffers.get(sample.url);
      if (
        !buffer ||
        disposed ||
        bank !== current ||
        requestedGeneration !== generation
      )
        return;
      const when = context.now() + Math.max(0, delay);
      lastVoice.get(index)?.stop(when);
      const voice = new Tone.ToneBufferSource({
        context,
        url: buffer,
        playbackRate: playbackRate(sample),
        fadeIn: 0.001,
        fadeOut: 0.025,
        onended: () => {
          voices.delete(voice);
          if (lastVoice.get(index) === voice) lastVoice.delete(index);
          voice.dispose();
        },
      }).connect(gain);
      voices.set(voice, when);
      lastVoice.set(index, voice);
      voice.start(
        when,
        sample.offset,
        undefined,
        current.gain * Math.pow(Math.max(0.05, Math.min(1, strength)), 0.7),
      );
    },
    stop,
    setVolume(value: number) {
      volume = Math.max(0, Math.min(1, value));
      void ready
        .then(({ gain }) => {
          if (!disposed) gain.gain.rampTo(volume, 0.025);
        })
        .catch(() => {});
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      bank = undefined;
      downloads.abort();
      for (const voice of voices.keys()) voice.dispose();
      voices.clear();
      lastVoice.clear();
      buffers.clear();
      void ready
        .then(({ context, gain, limiter }) => {
          gain.dispose();
          limiter.dispose();
          void context.close().then(() => context.dispose());
        })
        .catch(() => {
          if (raw.state !== "closed") void raw.close();
        });
    },
  };
}
