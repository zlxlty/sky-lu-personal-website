import { describe, expect, it } from "vitest";
import { blogSchema, projectSchema } from "@/content/schema";
import {
  formatContentDate,
  newestFirst,
  publishedEntries,
} from "@/lib/content";

const post = {
  title: "A note",
  description: "Description",
  publishedAt: "2026-09-01",
  draft: false,
};

describe("publishing boundaries", () => {
  it("requires an explicit publication decision and rejects unknown fields", () => {
    expect(blogSchema.safeParse({ ...post, draft: undefined }).success).toBe(
      false,
    );
    expect(blogSchema.safeParse({ ...post, drafft: true }).success).toBe(false);
    expect(blogSchema.safeParse({ ...post, title: " " }).success).toBe(false);
    expect(
      blogSchema.safeParse({ ...post, publishedAt: "not a date" }).success,
    ).toBe(false);
  });
  it("rejects updates dated before publication", () => {
    expect(
      blogSchema.safeParse({ ...post, updatedAt: "2026-08-01" }).success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({ ...post, updatedAt: "2026-09-02" }).success,
    ).toBe(true);
  });
  it.each([null, false, 0, "", "2026-02-30"])(
    "rejects a missing or impossible publication date (%j)",
    (publishedAt) => {
      expect(blogSchema.safeParse({ ...post, publishedAt }).success).toBe(
        false,
      );
    },
  );
  it("validates project result labels and ordering", () => {
    const project = {
      title: "Project",
      description: "Description",
      category: "Research",
      context: "Lab",
      order: 0,
      draft: false,
      results: [{ value: "30%", label: "Throughput improvement" }],
    };
    expect(projectSchema.safeParse(project).success).toBe(true);
    expect(projectSchema.safeParse({ ...project, results: [] }).success).toBe(
      false,
    );
    expect(projectSchema.safeParse({ ...project, order: -1 }).success).toBe(
      false,
    );
    expect(
      projectSchema.safeParse({
        ...project,
        results: [{ value: "30%", label: "" }],
      }).success,
    ).toBe(false);
  });
  it("excludes drafts without mutating entries and sorts tied dates consistently", () => {
    const entries = [
      { id: "z", data: { draft: false, publishedAt: new Date("2026-09-01") } },
      {
        id: "draft",
        data: { draft: true, publishedAt: new Date("2026-09-02") },
      },
      { id: "a", data: { draft: false, publishedAt: new Date("2026-09-01") } },
      {
        id: "old",
        data: { draft: false, publishedAt: new Date("2026-08-01") },
      },
    ];
    expect(
      publishedEntries(entries)
        .toSorted(newestFirst)
        .map(({ id }) => id),
    ).toEqual(["a", "z", "old"]);
    expect(entries.map(({ id }) => id)).toEqual(["z", "draft", "a", "old"]);
  });
  it("formats dates in UTC, independent of the server timezone", () => {
    expect(formatContentDate(new Date("2026-09-01T00:00:00Z"))).toBe(
      "Sep 1, 2026",
    );
  });
});
