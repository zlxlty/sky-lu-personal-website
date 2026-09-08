const initialized = new WeakSet<HTMLElement>();

/** Enhance static hints without adding a React island or replacing their text. */
export function initializeTextHints() {
  for (const hint of document.querySelectorAll<HTMLElement>(
    "[data-text-hint]",
  )) {
    if (initialized.has(hint)) continue;
    const trigger = hint.querySelector<HTMLElement>("[data-text-hint-trigger]");
    const tooltip = hint.querySelector<HTMLElement>('[role="tooltip"]');
    if (!trigger || !tooltip) continue;
    initialized.add(hint);

    // The title is the native fallback when JavaScript is unavailable.
    trigger.removeAttribute("title");
    const position = () => {
      tooltip.style.translate = "";
      const box = tooltip.getBoundingClientRect();
      const shift = Math.max(
        12 - box.left,
        Math.min(0, innerWidth - 12 - box.right),
      );
      tooltip.style.translate = `${shift}px 0`;
    };
    const show = () => {
      tooltip.hidden = false;
      position();
    };
    const hide = () => {
      tooltip.hidden = true;
    };

    trigger.addEventListener("pointerenter", show);
    trigger.addEventListener("focus", show);
    // Padding bridges the gap so moving onto the hint doesn't dismiss it.
    hint.addEventListener("pointerleave", () => {
      if (document.activeElement !== trigger) hide();
    });
    trigger.addEventListener("blur", () => {
      if (!hint.matches(":hover")) hide();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") hide();
    });
    window.addEventListener("resize", () => {
      if (!tooltip.hidden) position();
    });
    window.addEventListener("pagehide", hide);
  }
}
