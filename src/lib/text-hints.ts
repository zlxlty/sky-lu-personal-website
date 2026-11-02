const wired = new Map<HTMLElement, AbortController>();
let rerunsAfterSwaps = false;

/** Enhance static hints without adding a React island or replacing their text. */
export function initializeTextHints() {
  // A page swap brings new hints, and their script doesn't run again.
  if (!rerunsAfterSwaps) {
    rerunsAfterSwaps = true;
    document.addEventListener("astro:page-load", initializeTextHints);
  }
  for (const [hint, events] of wired) {
    if (hint.isConnected) continue;
    events.abort();
    wired.delete(hint);
  }
  for (const hint of document.querySelectorAll<HTMLElement>(
    "[data-text-hint]",
  )) {
    if (wired.has(hint)) continue;
    const trigger = hint.querySelector<HTMLElement>("[data-text-hint-trigger]");
    const tooltip = hint.querySelector<HTMLElement>('[role="tooltip"]');
    if (!trigger || !tooltip) continue;
    const events = new AbortController();
    const { signal } = events;
    wired.set(hint, events);

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

    trigger.addEventListener("pointerenter", show, { signal });
    trigger.addEventListener("focus", show, { signal });
    // Padding bridges the gap so moving onto the hint doesn't dismiss it.
    hint.addEventListener(
      "pointerleave",
      () => {
        if (document.activeElement !== trigger) hide();
      },
      { signal },
    );
    trigger.addEventListener(
      "blur",
      () => {
        if (!hint.matches(":hover")) hide();
      },
      { signal },
    );
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") hide();
      },
      { signal },
    );
    window.addEventListener(
      "resize",
      () => {
        if (!tooltip.hidden) position();
      },
      { signal },
    );
    window.addEventListener("pagehide", hide, { signal });
  }
}
