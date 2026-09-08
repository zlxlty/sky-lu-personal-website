import {
  getNextTheme,
  parseTheme,
  resolveTheme,
  THEME_COLOR_SCHEMES,
  THEME_STORAGE_KEY,
  type Theme,
} from "@/lib/theme";

let controller: ReturnType<typeof createThemeController> | undefined;

/** Bind static controls after parsing. Repeated calls reuse this page's state. */
export function initializeTheme() {
  getController();
}

/** Call from browser handlers; importing this module during static rendering is safe. */
export function toggleTheme() {
  getController().toggle();
}

function getController() {
  return (controller ??= createThemeController());
}

function createThemeController() {
  const root = document.documentElement;
  const toggles = document.querySelectorAll<HTMLButtonElement>(
    "[data-theme-toggle]",
  );
  const status = document.querySelector<HTMLElement>("[data-theme-status]");
  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  let storage: Storage | undefined;
  let explicitTheme: Theme | null = null;

  try {
    storage = window.localStorage;
    explicitTheme = parseTheme(storage.getItem(THEME_STORAGE_KEY));
  } catch {
    // The dark default remains available when storage is blocked.
  }

  applyTheme(
    parseTheme(root.dataset.theme) ?? resolveTheme(explicitTheme),
    false,
  );

  toggles.forEach((toggle) => toggle.addEventListener("click", toggleTheme));

  window.addEventListener("storage", ({ key, newValue, storageArea }) => {
    // clear() has no key; session storage and unrelated preferences are ignored.
    if (
      storageArea !== storage ||
      (key !== null && key !== THEME_STORAGE_KEY)
    ) {
      return;
    }

    explicitTheme = parseTheme(newValue);
    applyTheme(resolveTheme(explicitTheme), true);
  });

  function togglePreference() {
    const theme = getNextTheme(
      parseTheme(root.dataset.theme) ?? resolveTheme(explicitTheme),
    );

    explicitTheme = theme;
    try {
      storage?.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Keep the explicit choice for this page even if it cannot be persisted.
    }
    applyTheme(theme, true);
  }

  function applyTheme(theme: Theme, announce: boolean) {
    const nextTheme = getNextTheme(theme);

    root.dataset.theme = theme;
    root.style.colorScheme = THEME_COLOR_SCHEMES[theme];

    const metaColor =
      theme === "dark"
        ? themeColor?.dataset.themeDark
        : themeColor?.dataset.themeLight;
    if (metaColor) themeColor?.setAttribute("content", metaColor);

    for (const toggle of toggles) {
      toggle.hidden = false;
      toggle.ariaLabel = `Switch to ${nextTheme} theme`;
      toggle.title = `Switch to ${nextTheme} theme`;
    }

    if (status) {
      status.textContent = announce ? `${capitalize(theme)} theme active.` : "";
    }
  }

  return { toggle: togglePreference };
}

function capitalize(value: Theme) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
