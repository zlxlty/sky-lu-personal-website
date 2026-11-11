import {
  bandCount,
  bandDecibels,
  bandLevels,
} from "../../src/lib/spectrum-bands.ts";

/** Mono PCM rate and window that match the browser analyser's 5.9 Hz bins. */
export const analysisRate = 24_000;
const size = 4096;
export const framesPerSecond = 20;

/** In-place radix-2 FFT. */
function transform(real: Float64Array, imaginary: Float64Array) {
  const length = real.length;
  for (let index = 1, swap = 0; index < length; index++) {
    let bit = length >> 1;
    for (; swap & bit; bit >>= 1) swap ^= bit;
    swap ^= bit;
    if (index < swap) {
      [real[index], real[swap]] = [real[swap] ?? 0, real[index] ?? 0];
      [imaginary[index], imaginary[swap]] = [
        imaginary[swap] ?? 0,
        imaginary[index] ?? 0,
      ];
    }
  }
  for (let span = 2; span <= length; span <<= 1) {
    const angle = (-2 * Math.PI) / span;
    for (let start = 0; start < length; start += span) {
      for (let offset = 0; offset < span / 2; offset++) {
        const cos = Math.cos(angle * offset);
        const sin = Math.sin(angle * offset);
        const even = start + offset;
        const odd = even + span / 2;
        const oddReal = (real[odd] ?? 0) * cos - (imaginary[odd] ?? 0) * sin;
        const oddImaginary =
          (real[odd] ?? 0) * sin + (imaginary[odd] ?? 0) * cos;
        real[odd] = (real[even] ?? 0) - oddReal;
        imaginary[odd] = (imaginary[even] ?? 0) - oddImaginary;
        real[even] = (real[even] ?? 0) + oddReal;
        imaginary[even] = (imaginary[even] ?? 0) + oddImaginary;
      }
    }
  }
}

/**
 * Band levels for a whole recording: a two-byte header (band count, frames per
 * second), then one byte per band per frame. The loudest moments read as full.
 */
export function recordingSpectrum(samples: Float32Array) {
  const hop = analysisRate / framesPerSecond;
  const frames = Math.ceil(samples.length / hop);
  // The Web Audio analyser's Blackman window, so both sources agree.
  const window = Float64Array.from(
    { length: size },
    (_, index) =>
      0.42 -
      0.5 * Math.cos((2 * Math.PI * index) / size) +
      0.08 * Math.cos((4 * Math.PI * index) / size),
  );
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  const bins = new Float32Array(size / 2);
  const decibels = new Float32Array(frames * bandCount);
  for (let frame = 0; frame < frames; frame++) {
    // Centre each window on its frame time.
    const start = frame * hop - size / 2;
    for (let index = 0; index < size; index++) {
      real[index] = (samples[start + index] ?? 0) * (window[index] ?? 0);
      imaginary[index] = 0;
    }
    transform(real, imaginary);
    for (let bin = 0; bin < bins.length; bin++)
      bins[bin] =
        20 * Math.log10(Math.hypot(real[bin] ?? 0, imaginary[bin] ?? 0) / size);
    bandDecibels(
      decibels.subarray(frame * bandCount, (frame + 1) * bandCount),
      bins,
      analysisRate / size,
    );
  }
  const loudest = Float32Array.from(decibels).filter(Number.isFinite).sort();
  const ceiling = loudest[Math.floor(loudest.length * 0.999)] ?? 0;
  const bytes = new Uint8Array(2 + decibels.length);
  bytes[0] = bandCount;
  bytes[1] = framesPerSecond;
  const levels = new Float32Array(bandCount);
  for (let frame = 0; frame < frames; frame++) {
    bandLevels(
      levels,
      decibels.subarray(frame * bandCount, (frame + 1) * bandCount),
      ceiling,
    );
    for (let band = 0; band < bandCount; band++)
      bytes[2 + frame * bandCount + band] = Math.round(
        (levels[band] ?? 0) * 255,
      );
  }
  return bytes;
}
