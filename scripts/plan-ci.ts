import { execFileSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  browserJobs,
  pullRequestRange,
  selectCiChecks,
} from "./ci-selection.ts";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const eventName = process.env.GITHUB_EVENT_NAME ?? "workflow_dispatch";
let paths: string[] | null = null;
if (eventName === "pull_request") {
  try {
    const event: unknown = JSON.parse(
      readFileSync(process.env.GITHUB_EVENT_PATH ?? "", "utf8"),
    );
    const range = pullRequestRange(event);
    if (range) {
      // Merge-base covers the entire PR. Disabling rename detection includes
      // both the old and new paths, so moving shared code cannot narrow checks.
      paths = execFileSync(
        "git",
        [
          "diff",
          "--name-only",
          "--no-renames",
          "-z",
          `${range.base}...${range.head}`,
        ],
        { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
      )
        .split("\0")
        .filter(Boolean);
    }
  } catch {
    // Missing history, malformed events, and diff failures fall back to full.
    paths = null;
  }
}

const selection = selectCiChecks(eventName, paths);
if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `quality=${selection.quality}\ngroups=${JSON.stringify(selection.groups)}\nsuites=${JSON.stringify(browserJobs(selection.groups))}\n`,
  );
}
console.log(JSON.stringify(selection, null, 2));
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    `## Selected checks\n\n${selection.reason}\n\n- Quality: ${selection.quality}\n- Browser groups: ${selection.groups.join(", ") || "none"}\n- WebKit: ${selection.webkit ? "yes" : "no"}\n`,
  );
}
