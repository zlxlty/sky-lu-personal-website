import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import recordings from "@/data/recordings.json";
import {
  parseRecordingSpectrum,
  sampleRecordingSpectrum,
} from "@/lib/record-spectrum";
import {
  bandCenters,
  bandCount,
  bandDecibels,
  bandLevels,
  dynamicRange,
} from "@/lib/spectrum-bands";
import {
  createWaveMotion,
  heroWaves,
  stepWaves,
  threadAlpha,
  threadOffset,
  waveSettings,
} from "@/lib/sound-waves";
import {
  framesPerSecond,
  recordingSpectrum,
  analysisRate,
} from "../../scripts/lib/recording-spectrum";

const binWidth = 48_000 / 8192;
function tone(frequency: number, decibels = -20) {
  const bins = new Float32Array(4096).fill(-160);
  bins[Math.round(frequency / binWidth)] = decibels;
  return bins;
}

describe("spectrum bands", () => {
  it("covers a guitar's range in steps of a fourth", () => {
    expect(bandCenters).toHaveLength(bandCount);
    expect(bandCount).toBe(17);
    expect(bandCenters[0]).toBe(100);
    // Twelve fourths are five octaves.
    expect(bandCenters[12]).toBeCloseTo(3200);
    expect(bandCenters.at(-1)).toBeCloseTo(10_159, 0);
  });

  it("puts a tone in the band around it and nowhere else", () => {
    const decibels = bandDecibels(
      new Float32Array(bandCount),
      tone(440),
      binWidth,
    );
    const loudest = decibels.indexOf(Math.max(...decibels));
    expect(bandCenters[loudest]).toBeCloseTo(423.8, 1);
    expect(
      decibels.filter((value) => value > (decibels[loudest] ?? 0) - 60),
    ).toHaveLength(1);
  });

  it("lifts overtones three decibels per octave", () => {
    // The same tone five octaves up reads fifteen decibels louder.
    const low = bandDecibels(new Float32Array(bandCount), tone(100), binWidth);
    const high = bandDecibels(
      new Float32Array(bandCount),
      tone(3200),
      binWidth,
    );
    expect(Math.max(...high) - Math.max(...low)).toBeCloseTo(15, 3);
  });

  it("maps the dynamic range below the ceiling onto a bar", () => {
    const decibels = new Float32Array(bandCount).fill(-100);
    decibels.set([-30, -30 - dynamicRange / 2, -30 - dynamicRange, -10]);
    const levels = bandLevels(new Float32Array(bandCount), decibels, -30);
    expect(Array.from(levels.subarray(0, 5))).toEqual([1, 0.5, 0, 1, 0]);
  });
});

describe("wave motion", () => {
  const frame = 1 / 60;
  const run = (
    motion: ReturnType<typeof createWaveMotion>,
    heard: Float32Array,
    seconds: number,
    settings = heroWaves,
  ) => {
    for (let elapsed = 0; elapsed < seconds; elapsed += frame)
      stepWaves(motion, heard, frame, settings);
  };
  /** Largest distance a thread strays from the base line anywhere along it. */
  const swing = (
    motion: ReturnType<typeof createWaveMotion>,
    thread: number,
    settings = heroWaves,
  ) =>
    Math.max(
      ...Array.from({ length: 500 }, (_, x) =>
        Math.abs(
          threadOffset(motion, thread, x, 141, settings.spread, settings),
        ),
      ),
    );

  it("gives each register its own thread", () => {
    const motion = createWaveMotion();
    const bass = new Float32Array(bandCount);
    bass.fill(1, 0, 3);
    run(motion, bass, 3);
    expect(motion.sizes[0]).toBeGreaterThan(0.95);
    expect(Math.max(...motion.sizes.subarray(1))).toBe(0);
    expect(swing(motion, 0)).toBeGreaterThan(15);
    expect(swing(motion, 0)).toBeLessThanOrEqual(20);
    expect(threadAlpha(motion, 0, heroWaves)).toBeCloseTo(0.6);
  });

  it("swells into a note and lets it fade slowly", () => {
    const motion = createWaveMotion();
    const sounding = motion.sizes.subarray(0, heroWaves.threads);
    const loud = new Float32Array(bandCount).fill(1);
    const silence = new Float32Array(bandCount);
    // No sudden jump on the attack: most of the way in half a second, full in two.
    run(motion, loud, 0.05);
    expect(Math.max(...sounding)).toBeLessThan(0.1);
    run(motion, loud, 0.45);
    expect(Math.min(...sounding)).toBeGreaterThan(0.5);
    expect(Math.max(...sounding)).toBeLessThan(0.8);
    run(motion, loud, 1.5);
    expect(Math.min(...sounding)).toBeGreaterThan(0.95);
    // The note lingers after it stops, then dies away.
    run(motion, silence, 0.3);
    expect(Math.min(...sounding)).toBeGreaterThan(0.4);
    run(motion, silence, 4);
    expect(Math.max(...sounding)).toBeLessThan(0.01);
  });

  it("starts a rise from rest and speeds up, instead of kicking off at full speed", () => {
    const motion = createWaveMotion();
    const loud = new Float32Array(bandCount).fill(1);
    const steps = Array.from({ length: 40 }, () => {
      const before = motion.sizes[0] ?? 0;
      stepWaves(motion, loud, frame, heroWaves);
      return (motion.sizes[0] ?? 0) - before;
    });
    // The first frame barely moves, and each early frame moves further.
    expect(steps[0]).toBeLessThan(0.01);
    expect(steps[2]).toBeGreaterThan(steps[0] ?? 0);
    expect(steps[6]).toBeGreaterThan(steps[2] ?? 0);
    // The fastest frame comes well into the rise, and is itself small.
    expect(steps.indexOf(Math.max(...steps))).toBeGreaterThan(8);
    expect(Math.max(...steps)).toBeLessThan(0.03);
  });

  it("lifts the idle ripple from a note's first moment", () => {
    const motion = createWaveMotion();
    const resting = swing(motion, 0);
    // A note still smaller than the ripple already shows.
    motion.sizes[0] = 0.05;
    expect(swing(motion, 0)).toBeGreaterThan(resting);
    // A full note fills the height and no more.
    motion.sizes[0] = 1;
    expect(swing(motion, 0)).toBeGreaterThan(19.5);
    expect(swing(motion, 0)).toBeLessThanOrEqual(20);
  });

  it("gathers the waves between the left rail and their reach", () => {
    const motion = createWaveMotion();
    run(motion, new Float32Array(bandCount).fill(1), 0.2);
    for (let thread = 0; thread < heroWaves.threads; thread++) {
      expect(threadOffset(motion, thread, 0, 141, 300, heroWaves)).toBeCloseTo(
        0,
      );
      expect(threadOffset(motion, thread, 441, 141, 300, heroWaves)).toBe(0);
      expect(threadOffset(motion, thread, 600, 141, 300, heroWaves)).toBe(0);
      // A narrow page ends them at its right rail instead.
      expect(threadOffset(motion, thread, 390, 141, 249, heroWaves)).toBe(0);
    }
  });

  it("lets a page override the hero's settings", () => {
    const page = waveSettings('{"height":10,"threads":3,"idle":0}');
    expect(page).toEqual({ ...heroWaves, height: 10, threads: 3, idle: 0 });
    const motion = createWaveMotion();
    run(motion, new Float32Array(bandCount).fill(1), 3, page);
    expect(swing(motion, 0, page)).toBeGreaterThan(8);
    expect(swing(motion, 0, page)).toBeLessThanOrEqual(10);
    expect(motion.sizes[2]).toBeGreaterThan(0.9);
    expect(motion.sizes[3]).toBe(0);
    run(motion, new Float32Array(bandCount), 5, page);
    expect(threadAlpha(motion, 0, page)).toBe(0);
  });

  it("ignores overrides it cannot use", () => {
    expect(waveSettings(undefined)).toEqual(heroWaves);
    expect(waveSettings("not json")).toEqual(heroWaves);
    expect(waveSettings('{"height":"tall","threads":40}')).toEqual({
      ...heroWaves,
      threads: 9,
    });
  });
});

describe("recording spectra", () => {
  it("analyses a tone into its band at the frame rate", () => {
    const samples = Float32Array.from(
      { length: analysisRate * 2 },
      (_, index) =>
        // One second of 1 kHz, then one of silence.
        index < analysisRate
          ? 0.5 * Math.sin((2 * Math.PI * 1000 * index) / analysisRate)
          : 0,
    );
    const spectrum = parseRecordingSpectrum(recordingSpectrum(samples).buffer);
    expect(spectrum?.framesPerSecond).toBe(framesPerSecond);
    expect(spectrum?.frames).toHaveLength(2 * framesPerSecond * bandCount);
    if (!spectrum) return;
    const during = new Float32Array(bandCount);
    sampleRecordingSpectrum(during, spectrum, 0.5);
    expect(bandCenters[during.indexOf(Math.max(...during))]).toBeCloseTo(
      1007.9,
      1,
    );
    expect(Math.max(...during)).toBe(1);
    const after = new Float32Array(bandCount);
    sampleRecordingSpectrum(after, spectrum, 1.5);
    expect(Math.max(...after)).toBe(0);
  });

  it("blends neighbouring frames and keeps a louder level already there", () => {
    const frames = new Uint8Array(2 + 2 * bandCount);
    frames.set([bandCount, 10]);
    frames[2 + bandCount] = 255;
    const spectrum = parseRecordingSpectrum(frames.buffer);
    if (!spectrum) throw new Error("Expected a spectrum");
    const levels = new Float32Array(bandCount);
    levels[1] = 0.7;
    sampleRecordingSpectrum(levels, spectrum, 0.05);
    expect(levels[0]).toBeCloseTo(0.5);
    expect(levels[1]).toBeCloseTo(0.7);
    sampleRecordingSpectrum(levels.fill(0), spectrum, 60);
    expect(Math.max(...levels)).toBe(0);
  });

  it("rejects data made for another band layout", () => {
    expect(
      parseRecordingSpectrum(Uint8Array.of(bandCount + 1, 20, 0).buffer),
    ).toBeUndefined();
    expect(parseRecordingSpectrum(new ArrayBuffer(0))).toBeUndefined();
  });

  it("ships exactly one current spectrum for each playlist recording", () => {
    const directory = resolve(process.cwd(), "src/assets/spectra");
    const expected = Object.values(recordings.files)
      .map((key) => key.replace(/^.*\//, "").replace(/\.m4a$/, ".bin"))
      .sort();
    expect(readdirSync(directory).sort()).toEqual(expected);
    for (const name of expected) {
      const bytes = readFileSync(resolve(directory, name));
      expect(
        parseRecordingSpectrum(
          bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ),
        )?.framesPerSecond,
        `${name}: run pnpm recordings spectra`,
      ).toBe(framesPerSecond);
    }
  });
});
