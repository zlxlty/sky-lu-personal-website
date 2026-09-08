import { expect, test } from "@playwright/test";
import { writingIdeas, writingsIntro } from "../../src/data/writings";

test("writings share tentative topics and the book link without inventing article links", async ({
  page,
}) => {
  for (const route of ["/", "/writing"]) {
    await page.goto(route);
    const section =
      route === "/" ? page.locator("#writings") : page.locator("main");
    await expect(
      section.getByText(writingsIntro, { exact: true }),
    ).toBeVisible();
    await expect(section.locator('h3[id^="writing-idea-"]')).toHaveText(
      writingIdeas.map((idea) => idea.title),
    );
    await expect(section.locator('h3[id^="writing-idea-"] a')).toHaveCount(0);
    await expect(
      section.getByRole("link", { name: "All writings" }),
    ).toHaveCount(0);
    const book = section.getByRole("link", {
      name: "The Joy of Abstraction",
      exact: true,
    });
    await expect(book).toHaveAttribute("href", writingIdeas[3].link.href);
    await book.focus();
    await expect(book).toBeFocused();
    await book.hover();
    await expect(book.locator("sketch-underline svg")).toHaveCSS(
      "visibility",
      "visible",
    );
    await expect(
      page
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Writings", exact: true }),
    ).toHaveAttribute("href", "/writing");
  }
});
