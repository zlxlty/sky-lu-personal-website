import type { PublicLink } from "./types";

interface Research {
  readonly role: string;
  readonly institution: string;
  readonly group: PublicLink;
  readonly collaborator: PublicLink;
  readonly summary: string;
  readonly interests: readonly string[];
  readonly projectIds: readonly string[];
}

/** Affiliation and wording are confirmed in PLAN.md §5.7, not inferred from the PDF. */
export const research: Research = {
  role: "Student researcher in the ATLAS Group",
  institution: "Brown University",
  group: { label: "ATLAS Group", href: "https://atlas.cs.brown.edu/" },
  collaborator: {
    label: "Nikos Vasilakis",
    href: "https://atlas.cs.brown.edu/team/",
  },
  summary:
    "My work with Nikos Vasilakis focused on Tundra: composable message-stream transformations for making communication behavior explicit and optimizable.",
  interests: [
    "Network systems",
    "Distributed systems",
    "Systems transformation",
    "Performance",
  ],
  projectIds: ["tundra"],
};
