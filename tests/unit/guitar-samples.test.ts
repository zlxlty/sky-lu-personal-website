import { describe, expect, it } from "vitest";
import { guitarBanks } from "@/lab/guitar-samples";
import { guitarVoicing } from "@/components/guitar/voicing";
import {
  playbackRate,
  sampleChoices,
} from "@/components/guitar/audio/sample-bank";

describe.each(guitarBanks)("$id recordings", (bank) => {
  it("covers all six strings at every MIDI velocity without overlapping layers", () => {
    for (let index = 0; index < 6; index++) {
      for (let velocity = 0; velocity <= 127; velocity++) {
        const choices = sampleChoices(bank, index, velocity / 127);
        expect(choices.length).toBe(bank.id === "shiny" ? 2 : 1);
        expect(new Set(choices.map((sample) => sample.low)).size).toBe(1);
        expect(new Set(choices.map((sample) => sample.take)).size).toBe(
          choices.length,
        );
      }
    }
  });

  it("plays the fretted E♭m11/B♭ pitches while retaining each recording's original pitch", () => {
    const notes = [68, 65, 61, 54, 51, 46];
    for (const sample of bank.samples) {
      expect(sample.midi).toBe(notes[sample.stringIndex]);
      const string = guitarVoicing.strings[sample.stringIndex];
      if (!string) throw new Error("Missing guitar string");
      expect(Math.abs(sample.rootMidi - string.openMidi)).toBeLessThanOrEqual(
        bank.id === "shiny" ? 1 : 0,
      );
      expect(playbackRate(sample)).toBeCloseTo(
        2 ** ((sample.midi - sample.rootMidi) / 12),
      );
      expect(sample.offset).toBeGreaterThanOrEqual(0);
    }
    expect(bank.gain).toBeGreaterThan(0);
  });

  if (bank.id === "quartertone" || bank.id === "iowa") {
    it("includes each recorded dynamic for every open string", () => {
      for (let index = 0; index < 6; index++) {
        const samples = bank.samples.filter(
          (sample) => sample.stringIndex === index,
        );
        expect(samples).toHaveLength(bank.id === "quartertone" ? 4 : 3);
        expect(new Set(samples.map((sample) => sample.url)).size).toBe(
          samples.length,
        );
      }
    });
  }

  it("clamps gesture strength to the recorded range", () => {
    expect(sampleChoices(bank, 0, -1)).toEqual(sampleChoices(bank, 0, 0));
    expect(sampleChoices(bank, 0, 2)).toEqual(sampleChoices(bank, 0, 1));
    expect(sampleChoices(bank, 6, 0.5)).toEqual([]);
  });
});
