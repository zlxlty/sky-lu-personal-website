import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertProductionCheckout } from "./production-release.ts";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
const ci = process.env.GITHUB_ACTIONS === "true";

function checkedRevision() {
  return assertProductionCheckout({
    branch: git("branch", "--show-current"),
    dirty: git("status", "--porcelain").length > 0,
    revision: git("rev-parse", "HEAD"),
    remoteMain: git(
      "ls-remote",
      "--exit-code",
      "origin",
      "refs/heads/main",
    ).split(/\s/)[0],
    ci: ci
      ? {
          ref: process.env.GITHUB_REF ?? "",
          revision: process.env.GITHUB_SHA ?? "",
        }
      : undefined,
  });
}

const revision = checkedRevision();
const env = { ...process.env, GITHUB_SHA: revision };
const pnpm = (...args: string[]) =>
  execFileSync("pnpm", args, { cwd, env, stdio: "inherit" });

// CI has already run both required jobs for this revision. A local release runs
// the same verification before building the identified deployment artifact.
if (!ci) pnpm("verify:full");
pnpm("build");
if (checkedRevision() !== revision) {
  throw new Error("The release changed during verification; start again.");
}
pnpm(
  "exec",
  "wrangler",
  "deploy",
  "--config",
  "wrangler.jsonc",
  "--env",
  "production",
);
pnpm("cf:check", "https://skylu.me");
