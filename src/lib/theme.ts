export const THEMES = ["light", "dark"] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_STORAGE_KEY = "theme";
export const DARK_THEME_QUERY = "(prefers-color-scheme: dark)";

export const THEME_COLORS = {
  light: "#fcf3e6",
  dark: "#2b2724",
} as const satisfies Record<Theme, string>;

export const THEME_COLOR_SCHEMES = {
  light: "light",
  dark: "dark",
} as const satisfies Record<Theme, "light" | "dark">;

export function parseTheme(value: string | null | undefined): Theme | null {
  return value === "light" || value === "dark" ? value : null;
}

export function resolveTheme(
  storedTheme: string | null | undefined,
  prefersDark: boolean,
): Theme {
  return parseTheme(storedTheme) ?? (prefersDark ? "dark" : "light");
}

export function getNextTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}
