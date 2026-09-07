import { expect, it } from "vitest";
import { strumStrength } from "@/components/guitar/pluck";
import quartertone from "@/assets/guitar/quartertone.json";
import sources from "../../scripts/guitar-sources/quartertone.json";

it("uses a gentler bounded sound response without changing visual displacement", () => {
  expect(strumStrength(-1)).toBe(0.15);
  expect(strumStrength(0)).toBe(0.15);
  expect(strumStrength(1)).toBeCloseTo(0.227, 2);
  expect(strumStrength(2)).toBeGreaterThan(0.5);
  expect(strumStrength(2)).toBeLessThan(0.65);
  expect(strumStrength(3)).toBe(1);
  expect(strumStrength(100)).toBe(1);
});

it("omits every Yamaha recording from the strongest fifth tier", () => {
  expect(quartertone.samples).toHaveLength(24);
  const removed = sources.samples.filter(
    (sample) => sample.velocityLayer === 5,
  );
  expect(removed).toHaveLength(6);
  for (const sample of removed)
    expect(quartertone.samples.map((kept) => kept.file)).not.toContain(
      `quartertone/${sample.soundId}.mp3`,
    );
});
