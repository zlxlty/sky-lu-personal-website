import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { expect, it } from "vitest";

it("plans the whole PR against its merge base, including both paths of a rename", () => {
  const cwd = mkdtempSync(join(tmpdir(), "sky-ci-plan-"));
  const git = (...args: string[]) =>
    execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  const write = (path: string, text: string) => {
    const target = join(cwd, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
  };
  const commit = () => {
    git("add", ".");
    git(
      "-c",
      "user.name=CI fixture",
      "-c",
      "user.email=fixture",
      "-c",
      "commit.gpgsign=false",
      "commit",
      "-qm",
      "fixture",
    );
    return git("rev-parse", "HEAD");
  };
  const plan = (base: string, head: string) => {
    const eventPath = join(cwd, "event.json");
    const outputPath = join(cwd, "output.txt");
    writeFileSync(
      eventPath,
      JSON.stringify({
        pull_request: { base: { sha: base }, head: { sha: head } },
      }),
    );
    writeFileSync(outputPath, "");
    execFileSync(process.execPath, ["scripts/plan-ci.ts"], {
      cwd,
      encoding: "utf8",
      env: {
        ...process.env,
        GITHUB_EVENT_NAME: "pull_request",
        GITHUB_EVENT_PATH: eventPath,
        GITHUB_OUTPUT: outputPath,
        GITHUB_STEP_SUMMARY: "",
      },
    });
    return readFileSync(outputPath, "utf8");
  };

  try {
    git("init", "-q", "-b", "main");
    git("config", "core.hooksPath", "/dev/null");
    for (const script of ["ci-selection.ts", "plan-ci.ts"]) {
      mkdirSync(join(cwd, "scripts"), { recursive: true });
      copyFileSync(resolve("scripts", script), join(cwd, "scripts", script));
    }
    write(".gitignore", "event.json\noutput.txt\n");
    write("src/shared.md", "Existing shared source\n");
    const base = commit();
    git("switch", "-qc", "feature");
    write("src/data/people.ts", "export const people = [];\n");
    commit();
    write("README.md", "A later documentation-only commit\n");
    const head = commit();

    // A latest-commit-only diff would incorrectly skip all browser tests.
    expect(plan(base, head)).toContain('groups=["people"]');

    // An unrelated change on main must not enter the PR's change list.
    git("switch", "-q", "main");
    write("src/unrelated.ts", "export const unrelated = true;\n");
    const advancedBase = commit();
    git("switch", "-q", "feature");
    expect(plan(advancedBase, head)).toContain('groups=["people"]');

    // Moving a shared file into a narrowly selected directory still runs all.
    mkdirSync(join(cwd, "src/content/projects"), { recursive: true });
    git("mv", "src/shared.md", "src/content/projects/moved.md");
    const renamedHead = commit();
    expect(plan(base, renamedHead)).toContain('groups=["full"]');
    expect(plan("a".repeat(40), renamedHead)).toContain('groups=["full"]');
  } finally {
    rmSync(cwd, { recursive: true, force: true });
  }
});
