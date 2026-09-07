// Screen order is string 1 (treble) to string 6 (bass). Change the frets here
// to choose another playable chord; pitches and labels follow automatically.
const strings = [
  { name: "high E", openMidi: 64, fret: 4, gauge: 0.012 },
  { name: "B", openMidi: 59, fret: 6, gauge: 0.016 },
  { name: "G", openMidi: 55, fret: 6, gauge: 0.024 },
  { name: "D", openMidi: 50, fret: 4, gauge: 0.032 },
  { name: "A", openMidi: 45, fret: 6, gauge: 0.042 },
  { name: "low E", openMidi: 40, fret: 6, gauge: 0.053 },
] as const;

// Flat spellings suit the selected E-flat minor chord.
const pitchNames = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
] as const;

/** E♭m11/B♭: 6–6–4–6–6–4, bass to treble. Degrees: 5–1–♭3–♭7–9–11. */
export const guitarVoicing = {
  name: "E♭m11/B♭",
  strings: strings.map((string, index) => {
    const midi = string.openMidi + string.fret;
    const pitch = pitchNames[midi % 12];
    if (!pitch) throw new RangeError(`Invalid guitar pitch: ${midi}`);
    return {
      ...string,
      index,
      midi,
      note: `${pitch}${Math.floor(midi / 12) - 1}`,
    };
  }),
} as const;
