import { afterEach, describe, expect, it } from "vitest";

afterEach(() => {
  document.body.replaceChildren();
});

describe("unit test environment", () => {
  it("provides isolated DOM APIs", () => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Play";
    document.body.append(button);

    expect(document.querySelector("button")).toBe(button);
    expect(document.body.textContent).toBe("Play");
  });
});
