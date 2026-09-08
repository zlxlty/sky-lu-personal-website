/** Enhance native horizontal scrolling with local wheel and keyboard controls. */
class HorizontalTimeline extends HTMLElement {
  private cleanup?: () => void;

  connectedCallback() {
    this.cleanup?.();
    const viewport = this.querySelector<HTMLElement>(
      "[data-timeline-viewport]",
    );
    const track = viewport?.querySelector("ol");
    if (!viewport || !track) return;

    const abort = new AbortController();
    const options = { signal: abort.signal };
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const end = () => Math.max(0, viewport.scrollWidth - viewport.clientWidth);
    const scrollTo = (left: number) => {
      viewport.scrollTo({
        left,
        behavior: reducedMotion.matches ? "instant" : "smooth",
      });
    };
    const step = (direction: number) => {
      const width =
        track.firstElementChild?.getBoundingClientRect().width ??
        viewport.clientWidth;
      scrollTo(
        Math.max(0, Math.min(end(), viewport.scrollLeft + direction * width)),
      );
    };

    viewport.addEventListener(
      "wheel",
      (event) => {
        // Leave pinch-to-zoom and predominantly horizontal trackpad gestures native.
        if (event.ctrlKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY))
          return;
        const unit =
          event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
              ? viewport.clientWidth
              : 1;
        const delta = event.deltaY * unit;
        // At an endpoint (or when everything fits), let the page keep scrolling.
        if (
          (delta < 0 && viewport.scrollLeft <= 1) ||
          (delta > 0 && viewport.scrollLeft >= end() - 1)
        )
          return;
        event.preventDefault();
        // Apply trackpad deltas directly; restarting smooth scroll for every wheel
        // event fights the device's momentum and makes the timeline lag behind.
        viewport.scrollBy({ left: delta, behavior: "instant" });
      },
      { ...options, passive: false },
    );
    viewport.addEventListener(
      "keydown",
      (event) => {
        // Links keep their normal keyboard behavior; shortcuts are local to the region.
        if (
          event.target !== viewport ||
          event.altKey ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey
        )
          return;
        switch (event.key) {
          case "ArrowLeft":
            step(-1);
            break;
          case "ArrowRight":
            step(1);
            break;
          case "Home":
            scrollTo(0);
            break;
          case "End":
            scrollTo(end());
            break;
          default:
            return;
        }
        event.preventDefault();
      },
      options,
    );
    this.cleanup = () => {
      abort.abort();
    };
  }

  disconnectedCallback() {
    this.cleanup?.();
  }
}

if (!customElements.get("horizontal-timeline")) {
  customElements.define("horizontal-timeline", HorizontalTimeline);
}
