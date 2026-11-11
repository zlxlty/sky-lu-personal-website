/**
 * Bands a fourth wide, the interval between most guitar strings, from 100 Hz
 * to 10 kHz: a guitar's fundamentals and overtones. The browser's live
 * analyser and the offline recording analysis share this module, so both
 * sources draw on the same scale.
 */
export const bandCount = 17;
const bandRatio = 2 ** (5 / 12);
export const bandCenters: readonly number[] = Array.from(
  { length: bandCount },
  (_, band) => 100 * bandRatio ** band,
);

/** Decibels between silence and a full level. */
export const dynamicRange = 42;
/** Lift per octave, so overtones stay visible beside the fundamentals. */
const tiltPerOctave = 3;
const halfBand = Math.sqrt(bandRatio);

/**
 * Sum FFT bin power into each band. `bins` holds decibels per bin as an
 * `AnalyserNode` reports them; `binWidth` is the sample rate over the FFT size.
 */
export function bandDecibels(
  out: Float32Array,
  bins: Float32Array,
  binWidth: number,
) {
  for (let band = 0; band < bandCount; band++) {
    const center = bandCenters[band] ?? 0;
    const low = center / halfBand / binWidth + 0.5;
    const high = (center * halfBand) / binWidth + 0.5;
    let power = 0;
    for (
      let bin = Math.floor(low);
      bin < Math.min(bins.length, Math.ceil(high));
      bin++
    ) {
      // A bin straddling a band edge contributes only its covered share.
      const share = Math.min(bin + 1, high) - Math.max(bin, low);
      power += share * 10 ** ((bins[bin] ?? -Infinity) / 10);
    }
    out[band] =
      10 * Math.log10(power) + tiltPerOctave * Math.log2(center / 1000);
  }
  return out;
}

/** Scale band decibels to levels from 0 to 1, where `ceiling` reads as full. */
export function bandLevels(
  out: Float32Array,
  decibels: Float32Array,
  ceiling: number,
) {
  for (let band = 0; band < bandCount; band++) {
    const level = 1 + ((decibels[band] ?? -Infinity) - ceiling) / dynamicRange;
    out[band] = Math.min(1, Math.max(0, level));
  }
  return out;
}
