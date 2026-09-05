import { expect, test } from "@playwright/test";

for (const change of ["clear", "remove", "invalid"] as const) {
  test(`${change} saved preferences in another tab restores the live system theme`, async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to dark theme" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    const otherTab = await context.newPage();
    await otherTab.goto("/");
    await otherTab.evaluate((operation) => {
      if (operation === "clear") localStorage.clear();
      if (operation === "remove") localStorage.removeItem("theme");
      if (operation === "invalid") localStorage.setItem("theme", "invalid");
    }, change);

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("[data-theme-status]")).toHaveText(
      "Light theme active.",
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#fcf3e6",
    );
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
}

test("explicit theme choices stay synchronized across tabs", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("[data-theme-toggle]")).toBeVisible();
  const otherTab = await context.newPage();
  await otherTab.emulateMedia({ colorScheme: "light" });
  await otherTab.goto("/");
  await otherTab.getByRole("button", { name: "Switch to dark theme" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(otherTab.locator("html")).toHaveAttribute("data-theme", "light");
  await otherTab.emulateMedia({ colorScheme: "dark" });
  await expect(otherTab.locator("html")).toHaveAttribute("data-theme", "light");
});

test("session storage events from a same-origin frame do not change the theme", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await expect(page.locator("[data-theme-toggle]")).toBeVisible();

  await page.evaluate(async () => {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    const frameWindow = frame.contentWindow;
    if (!frameWindow) throw new Error("Missing frame window");
    const received = new Promise<void>((resolve) => {
      window.addEventListener(
        "storage",
        (event) => {
          if (event.storageArea === sessionStorage) resolve();
        },
        { once: true },
      );
    });
    frameWindow.sessionStorage.setItem("theme", "dark");
    await received;
    frame.remove();
  });

  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

for (const failure of ["access", "write"] as const) {
  test(`theme choice remains usable when storage ${failure} is blocked`, async ({
    page,
  }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    await page.emulateMedia({ colorScheme: "light" });
    await page.addInitScript((mode) => {
      const denied = () => {
        throw new DOMException("Storage unavailable", "SecurityError");
      };
      if (mode === "access") {
        Object.defineProperty(window, "localStorage", { get: denied });
      } else {
        Object.defineProperty(Storage.prototype, "setItem", { value: denied });
      }
    }, failure);
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "Switch to light theme" }).click();
    await page.emulateMedia({ colorScheme: "light" });
    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("[data-theme-status]")).toHaveText(
      "Light theme active.",
    );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#fcf3e6",
    );
    expect(runtimeErrors).toEqual([]);
  });
}
