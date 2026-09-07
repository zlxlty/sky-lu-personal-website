import { guitarVoicing } from "../voicing";

export interface GuitarSample {
  readonly url: string;
  readonly stringIndex: number;
  readonly midi: number;
  readonly rootMidi: number;
  readonly low: number;
  readonly high: number;
  readonly take: number;
  readonly offset: number;
}

export interface GuitarSampleBank {
  readonly id: string;
  readonly gain: number;
  readonly samples: readonly GuitarSample[];
}

interface PreparedBank {
  readonly id: string;
  readonly gain: number;
  readonly samples: readonly (Omit<GuitarSample, "url"> & { file: string })[];
}

/** Resolve assets at the caller's boundary and apply the shared fretted voicing. */
export function createSampleBank(
  bank: PreparedBank,
  resolveUrl: (file: string) => string | undefined,
): GuitarSampleBank {
  return {
    ...bank,
    samples: bank.samples.map((sample) => {
      const url = resolveUrl(sample.file);
      if (!url)
        throw new Error(`Missing prepared guitar sample: ${sample.file}`);
      const string = guitarVoicing.strings[sample.stringIndex];
      if (!string)
        throw new Error(`Invalid sample string index: ${sample.stringIndex}`);
      return { ...sample, midi: string.midi, url };
    }),
  };
}

/** Quantize to MIDI velocity so adjacent integer layer boundaries have no gaps. */
export function sampleChoices(
  bank: GuitarSampleBank,
  index: number,
  strength: number,
) {
  const velocity = Math.round(Math.max(0, Math.min(1, strength)) * 127) / 127;
  return bank.samples.filter(
    (sample) =>
      sample.stringIndex === index &&
      velocity >= sample.low &&
      velocity <= sample.high,
  );
}

export const playbackRate = (sample: GuitarSample) =>
  2 ** ((sample.midi - sample.rootMidi) / 12);
