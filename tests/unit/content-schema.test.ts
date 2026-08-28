import { describe, expect, it } from "vitest";

import { blogSchema, projectSchema } from "@/content/schema";

const validBlog = {
  title: "A systems note",
  description: "A short description.",
  publishedAt: "2026-08-28",
  draft: false,
};

const validProject = {
  title: "A project",
  description: "A short description.",
  kind: "research",
  tags: ["Rust"],
  draft: false,
};

describe("content collection schemas", () => {
  it("coerces article dates and applies the tag default", () => {
    const result = blogSchema.parse(validBlog);

    expect(result.publishedAt).toEqual(new Date("2026-08-28"));
    expect(result.tags).toEqual([]);
  });

  it("rejects invalid article fixtures", () => {
    expect(
      blogSchema.safeParse({ ...validBlog, publishedAt: "not-a-date" }).success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({
        ...validBlog,
        updatedAt: "2026-08-27",
      }).success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({ ...validBlog, unexpected: true }).success,
    ).toBe(false);
    expect(
      blogSchema.safeParse({
        title: validBlog.title,
        description: validBlog.description,
        publishedAt: validBlog.publishedAt,
      }).success,
    ).toBe(false);
  });

  it("rejects invalid project fixtures", () => {
    expect(
      projectSchema.safeParse({ ...validProject, kind: "hobby" }).success,
    ).toBe(false);
    expect(projectSchema.safeParse({ ...validProject, tags: [] }).success).toBe(
      false,
    );
    expect(
      projectSchema.safeParse({
        ...validProject,
        canonicalUrl: "not-a-url",
      }).success,
    ).toBe(false);
    expect(
      projectSchema.safeParse({
        ...validProject,
        canonicalUrl: "http://example.com/project",
      }).success,
    ).toBe(false);
  });
});
