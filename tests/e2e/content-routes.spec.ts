import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const PUBLIC_RESUME_SHA256 =
  "74405d196eea7a2235889a25e87503a3d2318ebce4dc8e78530969fe18443ea1";

test("writing index exposes an accessible unpublished state", async ({
  page,
}) => {
  const response = await page.goto("/writing");
  const accessibility = await new AxeBuilder({ page }).analyze();

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Writing — Sky Lu");
  await expect(
    page.getByRole("heading", { level: 1, name: "Writing" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "No published notes yet" }),
  ).toBeVisible();
  await expect(page.getByText("Content model foundation")).toHaveCount(0);
  await expect(page.locator("astro-island")).toHaveCount(0);
  expect(accessibility.violations).toEqual([]);
});

test("short routes extend the content rail to the viewport bottom", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1200 });
  await page.goto("/writing");

  const geometry = await page.evaluate(() => {
    const rail = document.querySelector<HTMLElement>(
      '[data-slot="blueprint-rail"]',
    );
    if (!rail) throw new Error("Missing blueprint rail");

    return {
      railBottom: rail.getBoundingClientRect().bottom,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    };
  });

  expect(geometry.railBottom).toBeCloseTo(geometry.viewportHeight, 3);
  expect(geometry.documentHeight).toBe(geometry.viewportHeight);
});

for (const project of [
  { slug: "dynamic-pages", title: "Dynamic Pages at Cloudflare" },
  { slug: "efficient-llm-serving", title: "Efficient LLM serving" },
  { slug: "tundra", title: "Tundra" },
  { slug: "kvonset", title: "KVonset" },
] as const) {
  test(`${project.title} has a static accessible case study`, async ({
    page,
  }) => {
    const response = await page.goto(`/project/${project.slug}`);
    const accessibility = await new AxeBuilder({ page }).analyze();

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle(`${project.title} — Sky Lu`);
    await expect(
      page.getByRole("heading", { level: 1, name: project.title }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/",
    );
    await expect(page.locator('[data-slot="project-body"]')).toBeVisible();
    await expect(page.locator("astro-island")).toHaveCount(0);
    expect(accessibility.violations).toEqual([]);
  });
}

test("unknown routes use the branded static 404", async ({ page }) => {
  const response = await page.goto("/route-that-does-not-exist");

  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle("Page not found — Sky Lu");
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Return to the homepage" }),
  ).toHaveAttribute("href", "/");
});

test("cv publishes the approved resume verbatim behind a cached redirect", async ({
  request,
}) => {
  const pdf = await request.get("/sky-lu-resume.pdf");
  const pdfBody = await pdf.body();
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(pdfBody.subarray(0, 5).toString()).toBe("%PDF-");
  expect(createHash("sha256").update(pdfBody).digest("hex")).toBe(
    PUBLIC_RESUME_SHA256,
  );
  expect(existsSync("dist/sky-lu-resume.pdf")).toBe(true);
  expect(
    createHash("sha256")
      .update(readFileSync("dist/sky-lu-resume.pdf"))
      .digest("hex"),
  ).toBe(PUBLIC_RESUME_SHA256);

  const redirects = readFileSync("dist/_redirects", "utf8");
  expect(redirects.trim()).toBe("/cv /sky-lu-resume.pdf 302");

  const headers = readFileSync("dist/_headers", "utf8");
  expect(headers).toContain("/sky-lu-resume.pdf");
  expect(headers).toContain(
    "Cache-Control: public, max-age=3600, must-revalidate",
  );
  expect(headers).toContain(
    'Content-Disposition: inline; filename="sky-lu-resume.pdf"',
  );
});

test("project content works without client JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });
  const page = await context.newPage();

  await page.goto("/project/tundra");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tundra" }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="project-body"]')).toContainText(
    "message-stream transformations",
  );

  const homeLink = page.getByRole("link", { name: "Home" });
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(homeLink).toBeFocused();
  await homeLink.click();
  await expect(page).toHaveURL("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Sky Lu" }),
  ).toBeVisible();

  await context.close();
});

test("nested stripe separators paint horizontal rules without vertical borders", async ({
  page,
}) => {
  await page.goto("/project/tundra");

  const separator = page.locator(
    '[data-slot="project-body"] [data-slot="stripe-separator"]',
  );
  const pattern = separator.locator('[data-slot="stripe-pattern"]');
  await expect(separator).toBeVisible();
  await expect(pattern).toBeVisible();

  const borders = await separator.evaluate((element) => {
    const pattern = element.querySelector<HTMLElement>(
      '[data-slot="stripe-pattern"]',
    );
    if (!pattern) throw new Error("Missing stripe pattern");

    const separatorStyle = getComputedStyle(element);
    const patternStyle = getComputedStyle(pattern);

    return {
      separator: {
        top: separatorStyle.borderTopWidth,
        right: separatorStyle.borderRightWidth,
        bottom: separatorStyle.borderBottomWidth,
        left: separatorStyle.borderLeftWidth,
      },
      pattern: {
        top: patternStyle.borderTopWidth,
        right: patternStyle.borderRightWidth,
        bottom: patternStyle.borderBottomWidth,
        left: patternStyle.borderLeftWidth,
      },
    };
  });

  expect(borders).toEqual({
    separator: {
      top: "0px",
      right: "0px",
      bottom: "0px",
      left: "0px",
    },
    pattern: {
      top: "1px",
      right: "0px",
      bottom: "1px",
      left: "0px",
    },
  });
});

test("direct stripe separators share panel boundaries without doubling", async ({
  page,
}) => {
  await page.goto("/project/dynamic-pages");

  const separator = page.locator(
    '[data-slot="panel"] > [data-slot="stripe-separator"]',
  );
  const pattern = separator.locator('[data-slot="stripe-pattern"]');
  const nextSection = separator.locator('+ [data-slot="panel-body"]');

  await expect(separator).toBeVisible();
  await expect(pattern).toBeVisible();

  const boundary = await separator.evaluate((element) => {
    const pattern = element.querySelector<HTMLElement>(
      '[data-slot="stripe-pattern"]',
    );
    const nextSection = element.nextElementSibling;
    if (!pattern || !nextSection) throw new Error("Missing stripe boundary");

    const patternStyle = getComputedStyle(pattern);
    const nextSectionBefore = getComputedStyle(nextSection, "::before");

    return {
      stripeTop: patternStyle.borderTopWidth,
      stripeBottom: patternStyle.borderBottomWidth,
      stripeLeft: patternStyle.borderLeftWidth,
      stripeRight: patternStyle.borderRightWidth,
      nextSectionRule: nextSectionBefore.content,
    };
  });

  await expect(nextSection).toBeVisible();
  expect(boundary).toEqual({
    stripeTop: "0px",
    stripeBottom: "1px",
    stripeLeft: "0px",
    stripeRight: "0px",
    nextSectionRule: "none",
  });
});
