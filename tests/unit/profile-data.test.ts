import { describe, expect, it } from "vitest";
import { experience } from "@/data/experience";
import { education } from "@/data/profile";

describe("profile authoring constraints", () => {
  it("keeps month-precision dates valid and records newest first", () => {
    const dates = [
      ...education.map(({ graduation }) => graduation.date),
      ...experience.flatMap(({ start, end }) => (end ? [start, end] : [start])),
    ];
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    }
    for (const { start, end } of experience) {
      if (end) expect(end >= start).toBe(true);
    }
    const starts = experience.map(({ start }) => start);
    expect(starts).toEqual(starts.toSorted().reverse());
    const graduations = education.map(({ graduation }) => graduation.date);
    expect(graduations).toEqual(graduations.toSorted().reverse());
  });

  it("keeps stable IDs unique and experience disclosures within three bullets", () => {
    for (const records of [education, experience]) {
      const ids = records.map(({ id }) => id);
      expect(new Set(ids).size).toBe(ids.length);
    }
    for (const { highlights, projectIds } of experience) {
      expect(highlights.length).toBeGreaterThan(0);
      expect(highlights.length).toBeLessThanOrEqual(3);
      expect(highlights.every((text) => text.trim().length > 0)).toBe(true);
      expect(new Set(projectIds).size).toBe(projectIds.length);
    }
  });
});
