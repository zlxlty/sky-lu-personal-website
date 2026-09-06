import { exec } from "node:child_process";
import { cp, mkdtemp, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, join, resolve } from "node:path";
import { promisify } from "node:util";
import { it } from "vitest";
import { scripts } from "../../package.json";

const run = promisify(exec);

it.each(["lint", "lint:fix"] as const)(
  "%s works before a dev server or build has generated content types",
  async (command) => {
    const root = await realpath(
      await mkdtemp(join(tmpdir(), "sky-lint-workflow-")),
    );
    try {
      await Promise.all([
        cp(resolve("src"), join(root, "src"), { recursive: true }),
        ...[
          "astro.config.mjs",
          "eslint.config.js",
          "tsconfig.json",
          "package.json",
        ].map((file) => cp(resolve(file), join(root, file))),
        symlink(resolve("node_modules"), join(root, "node_modules"), "dir"),
      ]);

      // Run the real script without pnpm trying to install into the shared link.
      // The fixture intentionally has no .astro directory or prior build.
      await run(scripts[command], {
        cwd: root,
        env: {
          ...process.env,
          PATH: `${resolve("node_modules/.bin")}${delimiter}${process.env.PATH ?? ""}`,
        },
      });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  30_000,
);
