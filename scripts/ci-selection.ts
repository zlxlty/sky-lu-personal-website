export type BrowserGroup = "full" | "content" | "people" | "guitar";
export type BrowserSuite = "e2e" | "lab";

export function parseBrowserSuite(
  value: string | undefined,
): BrowserSuite | undefined {
  if (value === undefined || value === "e2e" || value === "lab") return value;
  throw new Error("CI_BROWSER_SUITE must be e2e or lab.");
}

/** Split the existing command map without narrowing its test coverage. */
export function browserJobs(groups: readonly BrowserGroup[]) {
  return browserCommands(groups).map((command) => ({
    suite: command[0] === "test:e2e" ? "e2e" : "lab",
    webkit:
      command[0] === "test:e2e" &&
      (groups.includes("full") || groups.includes("guitar")),
  }));
}

export interface CiSelection {
  quality: "full" | "docs";
  groups: BrowserGroup[];
  webkit: boolean;
  reason: string;
}

const documentation = new Set([
  "README.md",
  "DEVELOPMENT.md",
  "CONTENT.md",
  "DEPLOYMENT.md",
  "PLAN.md",
  "IMPLEMENTATIONS.md",
]);

const fullSelection = (reason: string): CiSelection => ({
  quality: "full",
  groups: ["full"],
  webkit: true,
  reason,
});

/** Unknown inputs deliberately widen coverage, including changed tests and MDX. */
export function selectCiChecks(
  event: string,
  changedPaths: readonly string[] | null,
): CiSelection {
  if (event !== "pull_request")
    return fullSelection("Main and manual runs are full checks.");
  if (!changedPaths?.length)
    return fullSelection("No reliable change list; run everything.");

  const groups = new Set<BrowserGroup>();
  for (const path of changedPaths) {
    if (documentation.has(path)) continue;
    if (/^src\/content\/projects\/[^/]+\.md$/.test(path)) {
      groups.add("content");
    } else if (
      path === "src/data/people.ts" ||
      path === "src/pages/people.astro"
    ) {
      groups.add("people");
    } else if (/^src\/components\/guitar\/.+\.(ts|tsx|css)$/.test(path)) {
      groups.add("guitar");
    } else {
      return fullSelection("A shared or unrecognized path changed.");
    }
  }

  return {
    quality: groups.size ? "full" : "docs",
    groups: [...groups].sort(),
    webkit: groups.has("guitar"),
    reason: groups.size
      ? "Run affected browser groups and shared smoke checks."
      : "Only repository documentation changed.",
  };
}

function shaFrom(value: unknown): string | null {
  if (typeof value !== "object" || value === null || !("sha" in value))
    return null;
  return typeof value.sha === "string" && /^[a-f0-9]{40}$/.test(value.sha)
    ? value.sha
    : null;
}

export function pullRequestRange(
  event: unknown,
): { base: string; head: string } | null {
  if (typeof event !== "object" || event === null || !("pull_request" in event))
    return null;
  const pr = event.pull_request;
  if (
    typeof pr !== "object" ||
    pr === null ||
    !("base" in pr) ||
    !("head" in pr)
  )
    return null;
  const base = shaFrom(pr.base);
  const head = shaFrom(pr.head);
  return base && head ? { base, head } : null;
}

export function parseBrowserGroups(json: string | undefined): BrowserGroup[] {
  if (json === undefined) return ["full"];
  const value: unknown = JSON.parse(json);
  if (!Array.isArray(value))
    throw new Error("CI browser groups must be an array.");
  const entries: readonly unknown[] = value;
  const groups: BrowserGroup[] = [];
  for (const group of entries) {
    if (
      group !== "full" &&
      group !== "content" &&
      group !== "people" &&
      group !== "guitar"
    ) {
      throw new Error("Unknown CI browser group.");
    }
    if (!groups.includes(group)) groups.push(group);
  }
  return groups;
}

const smoke = ["homepage.spec.ts", "site-shell.spec.ts"];
const e2eGroups = {
  content: [
    "content.spec.ts",
    "prose.spec.ts",
    "homepage-content.spec.ts",
    "sketch-underline.spec.ts",
    "context-notes.spec.ts",
  ],
  people: ["people.spec.ts", "context-notes.spec.ts"],
  guitar: [
    "guitar.spec.ts",
    "guitar-audio.spec.ts",
    "guitar-mobile.spec.ts",
    "home-header.spec.ts",
    "homepage-content.spec.ts",
    "turntable-focus.spec.ts",
    "theme.spec.ts",
  ],
};

/** Arguments come only from this map, never directly from changed filenames. */
export function browserCommands(
  groups: readonly BrowserGroup[],
  suite?: BrowserSuite,
): string[][] {
  const commands = selectedBrowserCommands(groups);
  return suite === undefined
    ? commands
    : commands.filter(
        (command) =>
          command[0] === (suite === "e2e" ? "test:e2e" : "test:lab:ci"),
      );
}

function selectedBrowserCommands(groups: readonly BrowserGroup[]): string[][] {
  if (!groups.length) return [];
  if (groups.includes("full")) return [["test:e2e"], ["test:lab:ci"]];
  const e2e = new Set(smoke);
  for (const group of groups) {
    if (group === "full") continue;
    for (const file of e2eGroups[group]) e2e.add(file);
  }
  const guitar = groups.includes("guitar");
  const commands = [
    ["test:e2e", ...[...e2e].sort().map((file) => `tests/e2e/${file}`)],
  ];
  if (!guitar) commands[0]?.push("--project=chromium");
  if (guitar)
    commands.push([
      "test:lab:ci",
      "tests/lab/lab.spec.ts",
      "tests/lab/guitar-audio.spec.ts",
    ]);
  return commands;
}
