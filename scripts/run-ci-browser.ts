import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  browserCommands,
  parseBrowserGroups,
  parseBrowserSuite,
} from "./ci-selection.ts";

const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== "--list")) {
  throw new Error(
    "Only --list is supported; select suites with CI_BROWSER_GROUPS.",
  );
}
const commands = browserCommands(
  parseBrowserGroups(process.env.CI_BROWSER_GROUPS),
  parseBrowserSuite(process.env.CI_BROWSER_SUITE),
);
if (!commands.length) console.log("No browser checks selected for this suite.");
for (const command of commands) {
  console.log(
    `Running pnpm ${command.join(" ")}${args.length ? " --list" : ""}`,
  );
  execFileSync("pnpm", [...command, ...args], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "inherit",
  });
}
