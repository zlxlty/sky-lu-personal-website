import { describe, expect, it } from "vitest";

import { filterDraftEntries } from "@/lib/content";

const entries = [
  { id: "published", data: { draft: false } },
  { id: "draft", data: { draft: true } },
] as const;

describe("content visibility", () => {
  it("excludes drafts by default", () => {
    expect(filterDraftEntries(entries).map(({ id }) => id)).toEqual([
      "published",
    ]);
  });

  it("includes drafts only when a caller explicitly opts in", () => {
    expect(
      filterDraftEntries(entries, { includeDrafts: true }).map(({ id }) => id),
    ).toEqual(["published", "draft"]);
  });
});
