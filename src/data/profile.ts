import type { PublicLink, YearMonth } from "./types";

interface Profile {
  readonly name: string;
  readonly legalName: string;
  readonly siteDescription: string;
  readonly introduction: string;
  readonly links: {
    readonly github: PublicLink;
    readonly linkedin: PublicLink;
  };
}

export interface Education {
  readonly id: string;
  readonly institution: string;
  readonly degree: string;
  readonly location: string;
  readonly graduation: {
    readonly date: YearMonth;
    readonly status: "expected" | "completed";
  };
}

const name = "Sky Lu";

/** Public identity from the approved résumé; introduction from PLAN.md §5.3. */
export const profile: Profile = {
  name,
  legalName: "Tianyi Lu",
  siteDescription: `Personal website and technical writing by ${name}.`,
  // Nonbreaking spaces keep the phrase together without forcing a line break.
  introduction:
    "I'm a CS master's student at Brown, learning\u00a0and\u00a0building abstractions.",
  links: {
    github: { label: "GitHub", href: "https://github.com/zlxlty" },
    linkedin: {
      label: "LinkedIn",
      href: "https://linkedin.com/in/tianyi-lu-sky",
    },
  },
};

/** Newest first. Dates are explicit editorial facts, not inferred from today. */
export const education: readonly Education[] = [
  {
    id: "brown",
    institution: "Brown University",
    degree: "M.S. in Computer Science",
    location: "Providence, RI",
    graduation: { date: "2027-05", status: "expected" },
  },
  {
    id: "carleton",
    institution: "Carleton College",
    degree: "B.A. in Computer Science and Mathematics",
    location: "Northfield, MN",
    graduation: { date: "2025-03", status: "completed" },
  },
];
