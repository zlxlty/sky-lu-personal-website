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
  const sharedCachePath = resolve("node_modules/.astro/data-store.json");
  const readSharedCache = () =>
    readFile(sharedCachePath, "utf8").catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "ENOENT")
        return undefined;
      throw error;
    });
  try {
    const sharedCacheBefore = await readSharedCache();
    await Promise.all([
      cp(resolve("src"), join(root, "src"), { recursive: true }),
      cp(resolve("public"), join(root, "public"), { recursive: true }),
      ...["astro.config.mjs", "tsconfig.json", "package.json"].map((file) =>
        cp(resolve(file), join(root, file)),
      ),
      symlink(resolve("node_modules"), join(root, "node_modules"), "dir"),
    ]);
    // Resolve the real profile references through Astro's published query. This
    // fixture is never a public route; it catches renamed or draft-only targets.
    await writeFile(
      join(root, "src/pages/profile-data-check.astro"),
      `---
import { getProjects } from "@/content/queries";
import { experience } from "@/data/experience";
const projects = await getProjects();
const ids = experience.flatMap((entry) => entry.projectIds);
const related = ids.map((id) => {
  const project = projects.find((entry) => entry.id === id);
  if (!project) throw new Error(\`Profile references an unpublished or missing project: \${id}\`);
  return project;
});
---
{related.map((project) => <a href={\`/projects/\${project.id}\`}>{project.data.title}</a>)}
`,
    );
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
    // node_modules is shared, so Astro's default cache would let this fixture
    // overwrite (or read) another build's content store. Keep its cache local.
    const build = () =>
      run(
        process.execPath,
        [
          "--input-type=module",
          "--eval",
          'import {build} from "astro"; import {pathToFileURL} from "node:url"; const root=pathToFileURL(process.argv[1]+"/"); await build({root,cacheDir:".astro-cache"});',
          root,
        ],
        { cwd: process.cwd(), maxBuffer: 8 * 1024 * 1024 },
      );
    await build();
    expect(await readSharedCache()).toBe(sharedCacheBefore);
    const output = (path: string) => readFile(join(root, "dist", path), "utf8");
    expect(await output("profile-data-check/index.html")).toContain(
      'href="/projects/dynamic-pages"',
    );
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
    expect(await readSharedCache()).toBe(sharedCacheBefore);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 60_000);
