import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { friends } from "../../src/data/people";

for (const [width, theme] of [
  [320, "light"],
  [1440, "dark"],
] as const) {
  test(`People is readable and linked without JavaScript at ${width}px in ${theme}`, async ({
    browser,
    page: enhancedPage,
  }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width, height: 900 },
    });
    const page = await context.newPage();
    try {
      await page.goto("/people");
      await page.evaluate(
        (value) => (document.documentElement.dataset.theme = value),
        theme,
      );
      await expect(page).toHaveTitle("People — Sky Lu");
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
        "href",
        "https://skylu.me/people",
      );
      const navigation = page.getByRole("navigation", {
        name: "Main navigation",
      });
      await expect(
        navigation.getByRole("link", { name: "People" }),
      ).toHaveAttribute("aria-current", "page");
      const directory = page.getByRole("region", {
        name: "Friends who support and inspire me",
        exact: true,
      });
      await expect(directory.getByRole("heading", { level: 3 })).toHaveText(
        friends.map((friend) => friend.name),
      );
      const cells = directory.locator("[data-person]");
      const first = await cells.nth(0).boundingBox();
      const second = await cells.nth(1).boundingBox();
      if (!first || !second) throw new Error("Missing friend cells");
      if (width < 640) {
        expect(second.x).toBe(first.x);
        expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
      } else {
        expect(second.y).toBe(first.y);
        expect(second.x).toBeGreaterThan(first.x + first.width);
      }
      expect(
        await cells
          .first()
          .evaluate((cell) => getComputedStyle(cell, "::before").content),
      ).toBe('""');
      for (const friend of friends) {
        await expect(
          directory.getByRole("link", { name: friend.name, exact: true }),
        ).toHaveAttribute("href", friend.href);
      }
      await expect(
        directory.getByRole("link", { name: "Bari", exact: true }),
      ).toHaveAttribute("href", "https://www.instagram.com/uwccsc_bari/");
      await expect(page.locator("astro-island")).toHaveCount(0);
      for (const note of await page.locator("[data-people-order]").all()) {
        await expect(note).toBeHidden();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      const row = directory.getByRole("article", {
        name: friends[0].name,
        exact: true,
      });
      const name = await row.getByRole("heading").boundingBox();
      const note = await row.locator("p").boundingBox();
      if (!name || !note) throw new Error("Missing friend row");
      expect(note.y).toBeGreaterThanOrEqual(name.y + name.height);
      await navigation.getByRole("link", { name: "People" }).focus();
      await expect(
        navigation.getByRole("link", { name: "People" }),
      ).toBeFocused();
    } finally {
      await context.close();
    }
    // Axe needs script execution; audit the enhanced page separately from the
    // no-JavaScript reading and navigation checks above.
    await enhancedPage.setViewportSize({ width, height: 900 });
    await enhancedPage.goto("/people");
    await enhancedPage.evaluate(
      (value) => (document.documentElement.dataset.theme = value),
      theme,
    );
    const railNote = enhancedPage.locator('[data-people-order="rail"]');
    const inlineNote = enhancedPage.locator('[data-people-order="inline"]');
    const noteContainer = inlineNote.locator("..");
    if (width >= 1280) {
      await expect(railNote).toBeVisible();
      await expect(noteContainer).toHaveCSS("position", "absolute");
      await expect(noteContainer).toHaveCSS("width", "1px");
      const annotation = await railNote.boundingBox();
      const list = await enhancedPage
        .locator("[data-people-list]")
        .boundingBox();
      if (!annotation || !list) throw new Error("Missing People annotation");
      expect(annotation.x + annotation.width).toBeLessThan(list.x);
    } else {
      await expect(railNote).toBeHidden();
      await expect(inlineNote).toBeVisible();
      await expect(noteContainer).toHaveCSS("position", "static");
    }
    expect(
      (await new AxeBuilder({ page: enhancedPage }).analyze()).violations,
    ).toEqual([]);
  });
}

test("each visit shuffles complete friend rows and explains the order", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Math.random = () => Number(sessionStorage.getItem("shuffle-test") ?? "0");
  });
  await page.goto("/people");
  const names = page.locator("[data-person] h3");
  const original = friends.map((friend) => friend.name);
  await expect(names).toHaveText([...original.slice(1), original[0]]);
  await expect(
    page.locator('[data-people-order="inline"]'),
  ).not.toHaveAttribute("hidden");
  await expect(
    page.getByText(
      "Some of the people who support me, inspire me, and make life more interesting.",
      { exact: true },
    ),
  ).toBeVisible();
  for (const friend of friends) {
    const row = page.getByRole("article", { name: friend.name, exact: true });
    await expect(
      row.getByRole("link", { name: friend.name, exact: true }),
    ).toHaveAttribute("href", friend.href);
    await expect(row.locator("p")).toHaveText(
      friend.note
        .map((part) => (typeof part === "string" ? part : part.label))
        .join(""),
    );
  }
  await page.evaluate(() => sessionStorage.setItem("shuffle-test", "0.999"));
  await page.reload();
  await expect(names).toHaveText(original);
  await expect(
    page.locator('[data-people-order="inline"]'),
  ).not.toHaveAttribute("hidden");
});
