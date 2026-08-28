import { describe, expect, it } from "vitest";

import { education, profile, skills } from "@/data/profile";

describe("public portfolio data", () => {
  it("captures the approved identity and education facts", () => {
    expect(profile.name).toBe("Sky Lu");
    expect(profile.identityLabels).toEqual([
      "Brown M.S. CS '27",
      "Software Engineer",
      "Network Systems Researcher",
      "Jazz Guitarist",
    ]);
    expect(education).toMatchObject([
      {
        institution: "Brown University",
        fields: ["Computer Science"],
        completion: { status: "expected", month: "2027-05" },
      },
      {
        institution: "Carleton College",
        fields: ["Computer Science", "Mathematics"],
        completion: { status: "completed", month: "2025-03" },
      },
    ]);
  });

  it("keeps contact values out of shared public facts", () => {
    expect(JSON.stringify({ profile, education })).not.toMatch(
      /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i,
    );
  });

  it("uses stable identifiers and HTTPS social links", () => {
    const educationIds = education.map(({ id }) => id);
    expect(new Set(educationIds).size).toBe(educationIds.length);

    for (const link of profile.socialLinks) {
      expect(link.href).toMatch(/^https:\/\//);
    }
  });

  it("retains the résumé skill groups without creating a free-form tag cloud", () => {
    expect(skills.languages).toContain("Rust");
    expect(skills.frameworks).toContain("Hono");
    expect(skills.infrastructure).toEqual(
      expect.arrayContaining(["SGLang", "Memcached", "Kubernetes"]),
    );
  });
});
