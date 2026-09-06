import type { WAAPIAnimation } from "animejs/waapi";

export type RecordDirection = -1 | 1;
const threshold = 32; // SVG units, independent of the rendered record size.
const resting = "translateY(0px) rotate(0deg)";

/** Owns record translation and gesture cancellation; knows nothing about audio or metadata. */
export class VinylSelector {
  #drag?: { id: number; startY: number; offset: number };
  #settling = false;
  #events = new AbortController();
  #animation?: WAAPIAnimation;
  #generation = 0;
  #reduced = matchMedia("(prefers-reduced-motion: reduce)");

  constructor(
    private svg: SVGSVGElement,
    private record: SVGGElement,
    private onLift: () => void,
    private onChange: (direction: RecordDirection) => void,
  ) {
    const { signal } = this.#events;
    record.setAttribute("tabindex", "0");
    record.removeAttribute("aria-disabled");
    record.style.cursor = "grab";
    record.addEventListener("pointerdown", this.#grab, { signal });
    record.addEventListener("pointermove", this.#move, { signal });
    record.addEventListener("pointerup", this.#release, { signal });
    record.addEventListener("pointercancel", this.#cancel, { signal });
    record.addEventListener("lostpointercapture", this.#cancel, { signal });
    record.addEventListener("keydown", this.#key, { signal });
    // Assistive technology may activate a button directly without a pointer sequence.
    record.addEventListener(
      "click",
      (event) => {
        if (event.detail === 0) this.select(1);
      },
      { signal },
    );
    window.addEventListener("blur", this.#cancel, { signal });
    window.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape") this.#cancel();
      },
      { signal },
    );
    document.addEventListener(
      "visibilitychange",
      () => {
        if (document.hidden) this.#cancel();
      },
      { signal },
    );
    this.#reduced.addEventListener(
      "change",
      () => {
        if (this.#reduced.matches) this.#animation?.complete();
      },
      { signal },
    );
  }

  get busy() {
    return Boolean(this.#drag) || this.#settling;
  }

  select(direction: RecordDirection) {
    if (this.busy) return;
    this.onLift();
    void this.#swap(direction, 0);
  }

  dispose() {
    this.#endDrag();
    this.#events.abort();
    this.#generation++;
    this.#animation?.revert();
    this.record.style.transform = "";
    this.record.style.cursor = "";
    this.record.removeAttribute("data-changing");
    this.record.setAttribute("tabindex", "-1");
    this.record.setAttribute("aria-disabled", "true");
  }

  #y(event: PointerEvent) {
    const matrix = this.svg.getScreenCTM();
    return matrix
      ? new DOMPoint(event.clientX, event.clientY).matrixTransform(
          matrix.inverse(),
        ).y
      : null;
  }

  #transform(offset: number) {
    return `translateY(${offset}px) rotate(${offset * 0.055}deg)`;
  }

  #grab = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0 || this.busy) return;
    const y = this.#y(event);
    if (y === null) return;
    event.preventDefault();
    this.record.focus({ preventScroll: true });
    this.record.setPointerCapture(event.pointerId);
    this.#drag = { id: event.pointerId, startY: y, offset: 0 };
    this.record.setAttribute("data-changing", "");
    this.record.style.cursor = "grabbing";
    this.onLift();
  };

  #move = (event: PointerEvent) => {
    if (event.pointerId !== this.#drag?.id) return;
    const y = this.#y(event);
    if (y === null || !this.#drag) return;
    // Light resistance keeps the record attached to the gesture without a huge leap.
    this.#drag.offset = Math.max(
      -150,
      Math.min(150, (y - this.#drag.startY) * 0.8),
    );
    if (!this.#reduced.matches)
      this.record.style.transform = this.#transform(this.#drag.offset);
  };

  #key = (event: KeyboardEvent) => {
    const directions: Record<string, RecordDirection> = {
      ArrowUp: 1,
      ArrowRight: 1,
      Enter: 1,
      " ": 1,
      ArrowDown: -1,
      ArrowLeft: -1,
    };
    const direction = directions[event.key];
    if (direction === undefined) return;
    event.preventDefault();
    this.select(direction);
  };

  #release = (event: PointerEvent) => {
    if (event.pointerId !== this.#drag?.id) return;
    this.#move(event);
    const offset = this.#drag?.offset ?? 0;
    this.#endDrag();
    if (Math.abs(offset) >= threshold)
      void this.#swap(offset < 0 ? 1 : -1, offset);
    else void this.#return(offset);
  };

  #endDrag() {
    const drag = this.#drag;
    this.#drag = undefined;
    if (drag && this.record.hasPointerCapture(drag.id))
      this.record.releasePointerCapture(drag.id);
    this.record.style.cursor = "grab";
  }

  #cancel = () => {
    if (!this.#drag) return;
    const offset = this.#drag.offset;
    this.#endDrag();
    void this.#return(offset);
  };

  async #animate(
    from: number,
    to: number,
    duration: number,
    ease: string,
    token: number,
  ) {
    if (this.#reduced.matches || this.#events.signal.aborted) return;
    const { waapi } = await import("animejs/waapi");
    if (this.#events.signal.aborted || token !== this.#generation) return;
    this.#animation = waapi.animate(this.record, {
      transform: [this.#transform(from), this.#transform(to)],
      duration,
      ease,
    });
    // Native `finished` rejects on cancellation; disconnect cannot strand an awaiting swap.
    await Promise.all(
      this.#animation.animations.map((animation) =>
        animation.finished.catch(() => {}),
      ),
    );
    this.#animation.revert();
    this.#animation = undefined;
  }

  async #swap(direction: RecordDirection, offset: number) {
    this.#settling = true;
    this.record.setAttribute("data-changing", "");
    const token = ++this.#generation;
    let changed = false;
    try {
      await this.#animate(offset, -direction * 230, 180, "inCubic", token);
      if (this.#events.signal.aborted) return;
      this.onChange(direction);
      changed = true;
      await this.#animate(direction * 230, 0, 380, "outQuint", token);
    } catch {
      // A failed decorative import/animation must not prevent song selection.
      if (!changed && !this.#events.signal.aborted) this.onChange(direction);
    } finally {
      if (!this.#events.signal.aborted) {
        this.record.style.transform = resting;
        this.record.removeAttribute("data-changing");
      }
      this.#settling = false;
    }
  }

  async #return(offset: number) {
    this.#settling = true;
    this.record.setAttribute("data-changing", "");
    try {
      await this.#animate(offset, 0, 200, "outCubic", ++this.#generation);
    } catch {
      /* Return immediately if motion is unavailable. */
    } finally {
      if (!this.#events.signal.aborted) {
        this.record.style.transform = resting;
        this.record.removeAttribute("data-changing");
      }
      this.#settling = false;
    }
  }
}
