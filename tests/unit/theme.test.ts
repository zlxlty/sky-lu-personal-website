import { describe, expect, it } from "vitest";

import {
  getNextTheme,
  parseTheme,
  resolveTheme,
  THEME_COLORS,
  THEME_COLOR_SCHEMES,
} from "@/lib/theme";

describe("theme preference policy", () => {
  it("accepts only supported stored themes", () => {
    expect(parseTheme("light")).toBe("light");
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("system")).toBeNull();
    expect(parseTheme(null)).toBeNull();
  });

  it("prefers an explicit choice over the system preference", () => {
    expect(resolveTheme("light", true)).toBe("light");
    expect(resolveTheme("dark", false)).toBe("dark");
  });

  it("uses the system preference when no explicit choice exists", () => {
    expect(resolveTheme(null, true)).toBe("dark");
    expect(resolveTheme(undefined, false)).toBe("light");
  });

  it("toggles between the two supported themes", () => {
    expect(getNextTheme("light")).toBe("dark");
    expect(getNextTheme("dark")).toBe("light");
  });

  it("maps named themes to their canvas and native color scheme", () => {
    expect(THEME_COLORS).toEqual({ light: "#fcf3e6", dark: "#2b2724" });
    expect(THEME_COLOR_SCHEMES).toEqual({ light: "light", dark: "dark" });
  });
});
