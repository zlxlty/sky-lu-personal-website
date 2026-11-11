import { bandCount, bandDecibels, bandLevels } from "./spectrum-bands";

/** Something audible on the page. `read` raises `levels` to its band levels. */
export interface SpectrumSource {
  read(levels: Float32Array): void;
}

const sources = new Set<SpectrumSource>();

/** Offer a source to the hero's waves until the returned function is called. */
export function publishSpectrum(source: SpectrumSource) {
  sources.add(source);
  return () => {
    sources.delete(source);
  };
}

/** Fill `levels` with the loudest band levels; false when nothing can sound. */
export function readSpectrum(levels: Float32Array) {
  levels.fill(0);
  for (const source of sources) source.read(levels);
  return sources.size > 0;
}

/** A live source; a band at `ceiling` decibels reads as full. */
export function analyserSpectrum(
  analyser: AnalyserNode,
  ceiling: number,
): SpectrumSource {
  const bins = new Float32Array(analyser.frequencyBinCount);
  const decibels = new Float32Array(bandCount);
  return {
    read(levels) {
      analyser.getFloatFrequencyData(bins);
      bandDecibels(
        decibels,
        bins,
        analyser.context.sampleRate / analyser.fftSize,
      );
      bandLevels(decibels, decibels, ceiling);
      for (let band = 0; band < bandCount; band++)
        levels[band] = Math.max(levels[band] ?? 0, decibels[band] ?? 0);
    },
  };
}
