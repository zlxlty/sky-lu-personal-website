import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const manifest = JSON.parse(
  await readFile(resolve("package.json"), "utf8"),
) as { dependencies?: Record<string, string> };
const homepageSource = await readFile(resolve("src/pages/index.astro"), "utf8");
const layoutSource = await readFile(
  resolve("src/layouts/BaseLayout.astro"),
  "utf8",
);

describe("curated React control boundary", () => {
  it("installs only the primitive, variant, and command dependencies", () => {
    expect(manifest.dependencies).toMatchObject({
      "@base-ui/react": "^1.7.0",
      "class-variance-authority": "^0.7.1",
      cmdk: "^1.1.1",
    });
    expect(manifest.dependencies?.["lucide-react"]).toBeUndefined();
    expect(manifest.dependencies?.["radix-ui"]).toBeUndefined();
    expect(manifest.dependencies?.["tw-animate-css"]).toBeUndefined();
  });

  it("does not hydrate the control library before a feature island uses it", () => {
    expect(homepageSource).not.toContain("@/components/ui/");
    expect(layoutSource).not.toContain("@/components/ui/");
    expect(homepageSource).not.toMatch(/client:(?:load|idle|visible|only)/);
    expect(layoutSource).not.toMatch(/client:(?:load|idle|visible|only)/);
  });
});
