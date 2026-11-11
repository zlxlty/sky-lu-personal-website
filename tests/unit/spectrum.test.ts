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
