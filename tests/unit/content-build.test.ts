import { execFile } from "node:child_process";
import {
  cp,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { expect, it } from "vitest";

const run = promisify(execFile);

it("builds published article paths and navigation while excluding drafts", async () => {
  // Resolve macOS's /var -> /private/var alias before Astro creates virtual IDs.
  const root = await realpath(
    await mkdtemp(join(tmpdir(), "sky-content-build-")),
  );
  try {
    await Promise.all([
      cp(resolve("src"), join(root, "src"), { recursive: true }),
      cp(resolve("public"), join(root, "public"), { recursive: true }),
      ...["astro.config.mjs", "tsconfig.json", "package.json"].map((file) =>
        cp(resolve(file), join(root, file)),
      ),
      symlink(resolve("node_modules"), join(root, "node_modules"), "dir"),
    ]);
    const article = (title: string, date: string) =>
      `---\ntitle: ${title}\ndescription: Isolated publication fixture.\npublishedAt: ${date}\ndraft: false\n---\n\n## A real article heading\n\nContent rendered in the shared reading layout.\n`;
    await writeFile(
      join(root, "src/content/blog/new-note.md"),
      article("Published fixture & safe text", "2026-09-02"),
    );
    await writeFile(
      join(root, "src/content/blog/older-note.md"),
      article("Older fixture", "2026-09-01"),
    );
    const projectPath = join(root, "src/content/projects/kvonset.md");
    await writeFile(
      projectPath,
      (await readFile(projectPath, "utf8")).replace(
        "draft: false",
        "draft: true",
      ),
    );
    const build = () =>
      run(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          'import {build} from "astro"; import {pathToFileURL} from "node:url"; await build({root:pathToFileURL(process.argv[1]+"/")});',
          root,
        ],
        { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 },
      );
    await build();
    const output = (path: string) => readFile(join(root, "dist", path), "utf8");
    const page = await output("writing/new-note/index.html");
    expect(page).toContain("Published fixture &amp; safe text");
    expect(page).toContain('href="/writing/older-note"');
    expect(page).toContain('id="a-real-article-heading"');
    expect(page).not.toContain("astro-island");
    const index = await output("writing/index.html");
    expect(index).toContain('href="/writing/new-note"');
    expect(index).toContain('href="/writing/older-note"');
    expect(index.indexOf('href="/writing/new-note"')).toBeLessThan(
      index.indexOf('href="/writing/older-note"'),
    );
    expect(index).not.toContain("communication-as-composition");
    await expect(
      output("writing/communication-as-composition/index.html"),
    ).rejects.toMatchObject({ code: "ENOENT" });
    await expect(output("projects/kvonset/index.html")).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(await output("projects/index.html")).not.toContain("KVonset");
    expect(await output("projects/tundra/index.html")).not.toContain(
      'href="/projects/kvonset"',
    );
    await expect(
      output("lab/content/article/index.html"),
    ).rejects.toMatchObject({ code: "ENOENT" });

    await writeFile(
      join(root, "src/content/blog/invalid.md"),
      "---\ntitle: Missing publication fields\n---\n",
    );
    await expect(build()).rejects.toMatchObject({ code: 1 });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
