import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  browserCommands,
  browserJobs,
  parseBrowserGroups,
  parseBrowserSuite,
  pullRequestRange,
  selectCiChecks,
} from "../../scripts/ci-selection";

describe("CI change selection", () => {
  it.each(
    [
      [],
      ["full"],
      ["content"],
      ["people"],
      ["guitar"],
      ["content", "people", "guitar"],
    ].map((groups) => ({ groups })),
  )(
    "parallel jobs preserve the entire selection %j without duplication",
    ({ groups: entries }) => {
      const groups = parseBrowserGroups(JSON.stringify(entries));
      const jobs = browserJobs(groups);
      expect(
        jobs.flatMap((job) =>
          browserCommands(groups, parseBrowserSuite(job.suite)),
        ),
      ).toEqual(browserCommands(groups));
      expect(new Set(jobs.map((job) => job.suite)).size).toBe(jobs.length);
      expect(
        jobs.filter((job) => job.webkit).every((job) => job.suite === "e2e"),
      ).toBe(true);
    },
  );

  it("only installs WebKit for production suites that exercise it", () => {
    expect(browserJobs(["full"])).toEqual([
      { suite: "e2e", webkit: true },
      { suite: "lab", webkit: false },
    ]);
    expect(browserJobs(["content"])).toEqual([{ suite: "e2e", webkit: false }]);
    expect(() => parseBrowserSuite("typo")).toThrow();
  });

  it.each(["push", "workflow_dispatch", "schedule", "unknown"])(
    "runs everything on %s even for documentation",
    (event) => {
      expect(selectCiChecks(event, ["README.md"]).groups).toEqual(["full"]);
    },
  );

  it.each([null, []])(
    "falls back to full checks without a usable diff (%j)",
    (paths) => {
      expect(selectCiChecks("pull_request", paths).groups).toEqual(["full"]);
    },
  );

  it("only skips runtime checks for an explicit documentation allowlist", () => {
    expect(
      selectCiChecks("pull_request", ["README.md", "CONTENT.md"]),
    ).toMatchObject({
      quality: "docs",
      groups: [],
      webkit: false,
    });
    expect(
      selectCiChecks("pull_request", ["README.md", "src/new-module.ts"]).groups,
    ).toEqual(["full"]);
  });

  it.each([
    "src/content/schema.ts",
    "src/content/queries.ts",
    "src/content.config.ts",
    "src/styles/global.css",
    "src/components/site/SiteHeader.astro",
    "src/pages/projects/[slug].astro",
    "src/content/blog/post.mdx",
    "src/content/projects/post.mdx",
    "package.json",
    "pnpm-lock.yaml",
    ".github/workflows/ci.yml",
    "tests/e2e/people.spec.ts",
    "AGENTS.md",
    "scripts/ci-selection.ts",
    "src/assets/guitar/new-sample.mp3",
  ])("widens coverage for shared or unrecognized changes: %s", (path) => {
    expect(
      selectCiChecks("pull_request", ["src/data/people.ts", path]).groups,
    ).toEqual(["full"]);
  });

  it("keeps quality broad for content and selects every affected group in a mixed PR", () => {
    expect(
      selectCiChecks("pull_request", [
        "src/content/projects/tundra.md",
        "src/pages/people.astro",
        "README.md",
        "src/components/guitar/audio/guitar-audio.ts",
        "src/data/people.ts",
      ]),
    ).toMatchObject({
      quality: "full",
      groups: ["content", "guitar", "people"],
      webkit: true,
    });
  });

  it("does not mistake a move out of shared code for a content-only change", () => {
    // git diff --no-renames returns both paths, including deleted sources.
    expect(
      selectCiChecks("pull_request", [
        "src/components/site/OldPage.astro",
        "src/content/projects/new-page.md",
      ]).groups,
    ).toEqual(["full"]);
  });

  it("does not install WebKit for plain project copy or People changes", () => {
    for (const path of [
      "src/content/projects/tundra.md",
      "src/data/people.ts",
    ]) {
      expect(selectCiChecks("pull_request", [path]).webkit).toBe(false);
    }
  });
});

describe("PR revision boundaries", () => {
  it("reads base/head SHAs rather than assuming the previous commit covers the PR", () => {
    const base = "a".repeat(40);
    const head = "b".repeat(40);
    expect(
      pullRequestRange({
        pull_request: { base: { sha: base }, head: { sha: head } },
      }),
    ).toEqual({ base, head });
  });

  it.each([
    null,
    {},
    { pull_request: null },
    { pull_request: { base: { sha: "main" }, head: { sha: "--help" } } },
  ])("rejects incomplete or invalid revisions (%j)", (event) =>
    expect(pullRequestRange(event)).toBeNull(),
  );
});

describe("selected browser execution", () => {
  it("includes content consumers on the homepage and index, with no lab or touch suite", () => {
    const commands = browserCommands(["content"]);
    expect(commands).toHaveLength(1);
    expect(commands[0]).toEqual(
      expect.arrayContaining([
        "test:e2e",
        "tests/e2e/content.spec.ts",
        "tests/e2e/homepage-content.spec.ts",
        "tests/e2e/prose.spec.ts",
        "--project=chromium",
      ]),
    );
    expect(commands.flat()).not.toContain("tests/e2e/guitar-mobile.spec.ts");
  });

  it("includes touch, sound, focus interactions and lab coverage for guitar changes", () => {
    const commands = browserCommands(["guitar"]);
    expect(commands[0]).toEqual(
      expect.arrayContaining([
        "tests/e2e/guitar-mobile.spec.ts",
        "tests/e2e/guitar-audio.spec.ts",
        "tests/e2e/turntable-focus.spec.ts",
      ]),
    );
    expect(commands.flat()).not.toContain("--project=chromium");
    expect(commands[1]).toEqual(
      expect.arrayContaining(["test:lab:ci", "tests/lab/guitar-audio.spec.ts"]),
    );
  });

  it("unions mixed scopes without running shared tests twice", () => {
    const commands = browserCommands(["content", "people"]);
    expect(commands[0]).toContain("tests/e2e/people.spec.ts");
    expect(
      commands[0]?.filter((arg) => arg === "tests/e2e/context-notes.spec.ts"),
    ).toHaveLength(1);
  });

  it("uses the complete existing suites for full runs and nothing for documentation", () => {
    expect(browserCommands(["full", "people"])).toEqual([
      ["test:e2e"],
      ["test:lab:ci"],
    ]);
    expect(browserCommands([])).toEqual([]);
    expect(parseBrowserGroups(undefined)).toEqual(["full"]);
  });

  it.each(['"content"', '["unknown"]', "[1]", "{}", "null", ""])(
    "fails instead of silently skipping tests for invalid selections (%s)",
    (json) => expect(() => parseBrowserGroups(json)).toThrow(),
  );

  it("only references existing test files", () => {
    for (const command of browserCommands(["content", "people", "guitar"])) {
      for (const arg of command.filter((arg) => arg.startsWith("tests/"))) {
        expect(existsSync(arg), arg).toBe(true);
      }
    }
  });
});
