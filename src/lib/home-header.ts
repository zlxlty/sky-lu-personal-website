import type { WAAPIAnimation } from "animejs/waapi";

const fadeDistance = 96;
let initialized = false;

/** Enhance only the homepage's static header; other routes keep their paper mask. */
export function initializeHomeHeader() {
  const background = document.querySelector<HTMLElement>(
    '[data-home-header] [data-slot="site-header-background"]',
  );
  if (!background || initialized) return;
  initialized = true;

  let dispose = enhanceBackground(background);
  window.addEventListener("pagehide", () => dispose());
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) dispose = enhanceBackground(background);
  });
}

function enhanceBackground(background: HTMLElement) {
  const events = new AbortController();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let animation: WAAPIAnimation | undefined;
  let frame: number | undefined;
  let lastProgress = -1;

  const render = () => {
    // A paused animation is scrubbed by scroll position, so reversing scroll
    // reverses the fade. Reduced motion (and failed imports) use an instant mask.
    const progress =
      reduced.matches || !animation
        ? Number(scrollY > 0)
        : Math.max(0, Math.min(1, scrollY / fadeDistance));
    if (progress === lastProgress) return;
    lastProgress = progress;
    if (animation) animation.progress = progress;
    else background.style.opacity = String(progress);
  };
  const schedule = () => {
    frame ??= requestAnimationFrame(() => {
      frame = undefined;
      render();
    });
  };

  window.addEventListener("scroll", schedule, {
    passive: true,
    signal: events.signal,
  });
  reduced.addEventListener("change", schedule, { signal: events.signal });
  render();

  void import("animejs/waapi")
    .then(({ waapi }) => {
      if (events.signal.aborted) return;
      animation = waapi.animate(background, {
        opacity: [0, 1],
        duration: 1000,
        ease: "inOutQuad",
        autoplay: false,
        persist: true,
      });
      lastProgress = -1;
      render();
    })
    .catch(() => {
      // The static navigation remains usable with the instantaneous fallback.
    });

  return () => {
    events.abort();
    if (frame !== undefined) cancelAnimationFrame(frame);
    animation?.revert();
    background.style.removeProperty("opacity");
  };
}
