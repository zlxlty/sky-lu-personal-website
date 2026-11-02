import { NO_WHEEL_GESTURE, nextWheelGesture } from "./wheel-gesture";

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
    const canMove = (delta: number) =>
      delta < 0
        ? viewport.scrollLeft > 1
        : delta > 0 && viewport.scrollLeft < end() - 1;
    let gesture = NO_WHEEL_GESTURE;
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
        // Leave pinch-to-zoom native.
        if (event.ctrlKey) return;
        const sideways = Math.abs(event.deltaX) >= Math.abs(event.deltaY);
        const unit =
          event.deltaMode === WheelEvent.DOM_DELTA_LINE
            ? 16
            : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
              ? viewport.clientWidth
              : 1;
        const delta = event.deltaY * unit;
        // The first event after a pause decides who owns the whole gesture. One
        // that starts sideways or with room to move stays on the timeline, so a
        // flick's momentum stops at an endpoint instead of throwing the page.
        gesture = nextWheelGesture(
          gesture,
          event.timeStamp,
          sideways ? end() > 0 : canMove(delta),
        );
        // Leave predominantly horizontal trackpad gestures native.
        if (sideways) return;
        // A gesture that starts at an endpoint (or when everything fits) scrolls
        // the page. The browser already scrolls an uncancelable event itself.
        if (!gesture.timelineOwns || !event.cancelable) return;
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
