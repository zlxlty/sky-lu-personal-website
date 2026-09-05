// @vitest-environment node
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import manifest from "../../package.json";

const project = resolve(import.meta.dirname, "../..");
const installer = join(project, "node_modules/simple-git-hooks/cli.js");
let sandbox: string;
let checkout: string;
let env: NodeJS.ProcessEnv;

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), "website hooks "));
  checkout = join(sandbox, "checkout");
  const template = join(sandbox, "empty-template");
  mkdirSync(template);
  // Do not inherit the developer's Git configuration, index, or hook overrides.
  env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([key]) => !key.startsWith("GIT_") && !key.includes("SIMPLE_GIT_HOOKS"),
    ),
  );
  env.GIT_CONFIG_NOSYSTEM = "1";
  env.GIT_CONFIG_GLOBAL = join(sandbox, "gitconfig");
  env.GIT_TEMPLATE_DIR = template;

  // Borrow existing history locally; fixtures never create commits or use a remote.
  git(
    sandbox,
    "clone",
    "--shared",
    "--no-checkout",
    "--quiet",
    project,
    checkout,
  );
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

for (const layout of ["checkout", "linked worktree"] as const) {
  describe(layout, () => {
    let directory: string;

    beforeEach(() => {
      directory = checkout;
      if (layout === "linked worktree") {
        directory = join(sandbox, "linked worktree");
        git(
          checkout,
          "worktree",
          "add",
          "--detach",
          "--no-checkout",
          directory,
          "HEAD",
        );
      }
      writeConfig(directory);
    });

    it("installs an executable hook where Git actually runs it", () => {
      expectInstalledHook(directory);
    });

    it("honors a relative repository hook path", () => {
      git(directory, "config", "--local", "core.hooksPath", ".custom hooks");
      expectInstalledHook(directory);
    });

    it("honors an absolute global hook path", () => {
      git(
        directory,
        "config",
        "--global",
        "core.hooksPath",
        join(sandbox, "global hooks"),
      );
      expectInstalledHook(directory);
    });
  });
}

it("honors a worktree-scoped hook path", () => {
  const directory = join(sandbox, "linked worktree");
  git(
    checkout,
    "worktree",
    "add",
    "--detach",
    "--no-checkout",
    directory,
    "HEAD",
  );
  git(directory, "config", "extensions.worktreeConfig", "true");
  git(directory, "config", "--worktree", "core.hooksPath", ".worktree hooks");
  writeConfig(directory);
  expectInstalledHook(directory);
});

it("preserves hooks that the project does not manage", () => {
  writeConfig(checkout);
  const otherHook = git(
    checkout,
    "rev-parse",
    "--path-format=absolute",
    "--git-path",
    "hooks/pre-push",
  );
  mkdirSync(resolve(otherHook, ".."), { recursive: true });
  writeFileSync(otherHook, "#!/bin/sh\nexit 0\n", { mode: 0o755 });

  expectInstalledHook(checkout);
  expect(readFileSync(otherHook, "utf8")).toBe("#!/bin/sh\nexit 0\n");
});

it("fails the install command when the hook cannot be written", () => {
  writeConfig(checkout);
  const blockedPath = join(checkout, "blocked");
  writeFileSync(blockedPath, "A file cannot contain hook files.");
  git(checkout, "config", "core.hooksPath", blockedPath);

  const result = install(checkout);
  expect(result.status).toBe(1);
  expect(result.stdout + result.stderr).toContain("ENOTDIR");
});

it("retains the package's explicit install opt-out", () => {
  writeConfig(checkout);
  env.SKIP_INSTALL_SIMPLE_GIT_HOOKS = "1";

  expect(install(checkout).status).toBe(0);
  expect(existsSync(join(checkout, ".git/hooks/pre-commit"))).toBe(false);
});

it("skips a source archive without Git metadata", () => {
  const directory = join(sandbox, "archive");
  mkdirSync(directory);
  writeConfig(directory);

  const result = install(directory);
  expect(result.status).toBe(0);
  expect(result.stdout).toContain("No `.git` root folder found, skipping");
  expect(existsSync(join(directory, ".git"))).toBe(false);
});

function writeConfig(directory: string) {
  writeFileSync(
    join(directory, "package.json"),
    JSON.stringify({
      "simple-git-hooks": {
        ...manifest["simple-git-hooks"],
        "pre-commit": "exit 23",
      },
    }),
  );
}

function git(directory: string, ...args: string[]) {
  return execFileSync("git", args, {
    cwd: directory,
    env,
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
}

function install(directory: string) {
  return spawnSync(process.execPath, [installer], {
    cwd: directory,
    env,
    encoding: "utf8",
  });
}

function expectInstalledHook(directory: string) {
  const result = install(directory);
  expect(result.status).toBe(0);
  expect(result.stdout + result.stderr).not.toContain("[ERROR]");
  const hook = git(
    directory,
    "rev-parse",
    "--path-format=absolute",
    "--git-path",
    "hooks/pre-commit",
  );
  expect(statSync(hook).mode & 0o111).not.toBe(0);
  // This invokes the installed hook through Git without making a commit.
  expect(
    spawnSync("git", ["hook", "run", "pre-commit"], { cwd: directory, env })
      .status,
  ).toBe(23);
}
