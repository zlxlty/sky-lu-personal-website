import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";

// Exercise the shell that GitHub actually runs, including intentional skips.
const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
const script = workflow.match(
  /name: Require every selected browser suite to pass[\s\S]*?run: \|\n((?: {10}.*\n)+)/,
)?.[1];
if (!script) throw new Error("Missing Browser gate script");

describe("required Browser gate", () => {
  for (const selection of ["success", "failure", "cancelled", "skipped"]) {
    for (const suites of ["success", "failure", "cancelled", "skipped"]) {
      it(`handles selection=${selection}, suites=${suites}`, () => {
        for (const groups of ['["full"]', "[]", ""]) {
          const result = spawnSync("bash", ["-e", "-c", script], {
            env: {
              SELECTION_RESULT: selection,
              SUITES_RESULT: suites,
              CI_BROWSER_GROUPS: groups,
            },
          });
          const shouldPass =
            selection === "success" &&
            (groups === "[]"
              ? suites === "skipped"
              : groups !== "" && suites === "success");
          expect(result.status === 0, `groups=${groups}`).toBe(shouldPass);
        }
      });
    }
  }
});
