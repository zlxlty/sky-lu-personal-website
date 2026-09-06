import type { WAAPIAnimation } from "animejs/waapi";
import { VinylSelector, type RecordDirection } from "./vinyl-selector";
import {
  angularDelta,
  clampArmAngle,
  needleOnRecord,
  pointerAngle,
  tonearm,
} from "./turntable-geometry";

declare global {
  interface HTMLElementEventMap {
    "turntable-playback-request": CustomEvent<{ playing: boolean }>;
    "turntable-record-change": CustomEvent<{ direction: RecordDirection }>;
  }
}

/** Gestures request playback. Only the audio owner's `playing` attribute spins the disc. */
export class TurntableControl extends HTMLElement {
  static observedAttributes = ["playing", "record-design"];
  #svg: SVGSVGElement | null = null;
  #arm: SVGGElement | null = null;
  #disc: SVGGElement | null = null;
  #angle = 0;
  #drag?: {
    id: number;
    pointerAngle: number;
    armAngle: number;
    originalAngle: number;
  };
  #events?: AbortController;
  #observer?: IntersectionObserver;
  #visible = false;
  #reduced = matchMedia("(prefers-reduced-motion: reduce)");
  #spin?: WAAPIAnimation;
  #loading = false;
  #selector?: VinylSelector;
  #parking?: WAAPIAnimation;
  #armRevision = 0;

  connectedCallback() {
    this.#svg = this.querySelector("svg");
    this.#arm = this.querySelector("[data-turntable-arm]");
    this.#disc = this.querySelector("[data-turntable-disc]");
    if (!this.#svg || !this.#arm || !this.#disc) return;
    this.#arm.setAttribute("tabindex", "0");
    this.#arm.removeAttribute("aria-disabled");
    this.#events = new AbortController();
    const { signal } = this.#events;
    this.#arm.addEventListener("pointerdown", this.#grab, { signal });
    this.#arm.addEventListener("pointermove", this.#move, { signal });
    this.#arm.addEventListener("pointerup", this.#release, { signal });
    this.#arm.addEventListener("pointercancel", this.#cancel, { signal });
    this.#arm.addEventListener("lostpointercapture", this.#cancel, { signal });
    this.#arm.addEventListener("keydown", this.#key, { signal });
    window.addEventListener("blur", this.#cancel, { signal });
    document.addEventListener("visibilitychange", this.#renderSpin, { signal });
    this.#reduced.addEventListener("change", this.#renderSpin, { signal });
    this.#observer = new IntersectionObserver(([entry]) => {
      this.#visible = entry?.isIntersecting ?? false;
      this.#renderSpin();
    });
    this.#observer.observe(this);
    this.#setAngle(0);
    const record = this.querySelector<SVGGElement>("[data-turntable-record]");
    if (record && this.hasAttribute("selectable")) {
      this.#selector = new VinylSelector(
        this.#svg,
        record,
        () => this.park(),
        (direction) => {
          this.#spin?.revert();
          this.#spin = undefined;
          this.dispatchEvent(
            new CustomEvent("turntable-record-change", {
              bubbles: true,
              detail: { direction },
            }),
          );
        },
      );
    }
    this.attributeChangedCallback();
  }

  disconnectedCallback() {
    this.#cancel();
    this.#selector?.dispose();
    this.#selector = undefined;
    this.#parking?.revert();
    this.#events?.abort();
    this.#observer?.disconnect();
    this.#spin?.revert();
    this.#spin = undefined;
    this.#loading = false;
    this.#visible = false;
  }

  park() {
    this.#cancel();
    this.#request(false);
    const from = this.#angle;
    this.#setAngle(0);
    if (from && !this.#reduced.matches && this.#arm) {
      // Park playback state immediately, but keep the visible arm in place until
      // the animation takes over; its lazy setup can span a browser frame.
      this.#arm.style.transform = `rotate(${from}deg)`;
      void this.#animatePark(from, this.#armRevision);
    }
  }

  async #animatePark(from: number, revision: number) {
    const events = this.#events;
    try {
      const { waapi } = await import("animejs/waapi");
      if (
        events?.signal.aborted ||
        revision !== this.#armRevision ||
        !this.#arm
      )
        return;
      if (this.#reduced.matches) {
        this.#setAngle(0);
        return;
      }
      this.#parking = waapi.animate(this.#arm, {
        transform: [`rotate(${from}deg)`, "rotate(0deg)"],
        duration: 200,
        ease: "outCubic",
      });
    } catch {
      // A failed decorative import must still leave the arm at rest.
      if (!events?.signal.aborted && revision === this.#armRevision)
        this.#setAngle(0);
    }
  }

  attributeChangedCallback() {
    if (!this.isConnected || !this.#events) return;
    const labels = this.querySelectorAll("[data-vinyl-design]");
    const design =
      Number(this.getAttribute("record-design") ?? 0) % labels.length;
    labels.forEach((label, index) =>
      label.toggleAttribute("data-active", index === design),
    );
    if (
      this.hasAttribute("playing") &&
      !this.#drag &&
      !needleOnRecord(this.#angle)
    )
      this.#setAngle(tonearm.playAngle);
    if (this.hasAttribute("playing") && !this.#spin && !this.#loading)
      void this.#loadSpin();
    this.#renderSpin();
  }

  async #loadSpin() {
    const events = this.#events;
    this.#loading = true;
    try {
      const { waapi } = await import("animejs/waapi");
      if (events?.signal.aborted || !this.#disc) return;
      this.#spin = waapi.animate(this.#disc, {
        transform: ["rotate(0deg)", "rotate(360deg)"],
        duration: 1800,
        ease: "linear",
        loop: true,
        autoplay: false,
      });
      this.#renderSpin();
    } catch {
      // Decorative motion must not prevent a visitor from controlling audio.
    } finally {
      if (!events?.signal.aborted) this.#loading = false;
    }
  }

  #renderSpin = () => {
    if (this.#reduced.matches) this.#parking?.complete();
    const animate =
      this.hasAttribute("playing") &&
      this.#visible &&
      !document.hidden &&
      !this.#reduced.matches;
    if (animate) this.#spin?.resume();
    else this.#spin?.pause();
  };

  #setAngle(angle: number) {
    this.#parking?.revert();
    this.#parking = undefined;
    this.#armRevision++;
    this.#angle = clampArmAngle(angle);
    if (!this.#arm) return;
    this.#arm.style.transform = `rotate(${this.#angle}deg)`;
    this.#arm.setAttribute("aria-valuenow", String(Math.round(this.#angle)));
    this.#arm.setAttribute(
      "aria-valuetext",
      needleOnRecord(this.#angle) ? "Over the record" : "Off the record",
    );
  }

  #request(playing: boolean) {
    this.dispatchEvent(
      new CustomEvent("turntable-playback-request", {
        bubbles: true,
        detail: { playing },
      }),
    );
  }

  #point(event: PointerEvent) {
    const matrix = this.#svg?.getScreenCTM();
    if (!matrix) return null;
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(
      matrix.inverse(),
    );
  }

  #grab = (event: PointerEvent) => {
    if (
      !event.isPrimary ||
      event.button !== 0 ||
      this.#drag ||
      !this.#arm ||
      this.#selector?.busy
    )
      return;
    const point = this.#point(event);
    if (!point) return;
    event.preventDefault();
    this.#arm.focus({ preventScroll: true });
    this.#arm.setPointerCapture(event.pointerId);
    this.#drag = {
      id: event.pointerId,
      pointerAngle: pointerAngle(point),
      armAngle: this.#angle,
      originalAngle: this.#angle,
    };
    // Picking up the needle pauses first; releasing it over the grooves requests play.
    this.#request(false);
  };

  #move = (event: PointerEvent) => {
    if (!this.#drag || event.pointerId !== this.#drag.id) return;
    const point = this.#point(event);
    if (!point) return;
    const current = pointerAngle(point);
    this.#setAngle(
      this.#drag.armAngle + angularDelta(this.#drag.pointerAngle, current),
    );
    this.#drag.pointerAngle = current;
    this.#drag.armAngle = this.#angle;
  };

  #release = (event: PointerEvent) => {
    if (event.pointerId !== this.#drag?.id) return;
    this.#move(event);
    this.#endDrag();
    const onRecord = needleOnRecord(this.#angle);
    if (!onRecord) this.#setAngle(tonearm.minAngle);
    this.#request(onRecord);
  };

  #endDrag() {
    const drag = this.#drag;
    this.#drag = undefined;
    if (drag && this.#arm?.hasPointerCapture(drag.id))
      this.#arm.releasePointerCapture(drag.id);
  }

  #cancel = () => {
    if (!this.#drag) return;
    const original = this.#drag.originalAngle;
    this.#endDrag();
    this.#setAngle(original);
    this.#request(false);
  };

  #key = (event: KeyboardEvent) => {
    if (this.#selector?.busy) return;
    if (event.key === "Escape") {
      this.#cancel();
      return;
    }
    const targets: Record<string, number> = {
      ArrowRight: this.#angle + 2,
      ArrowUp: this.#angle + 2,
      ArrowLeft: this.#angle - 2,
      ArrowDown: this.#angle - 2,
      Home: tonearm.minAngle,
      End: tonearm.maxAngle,
      Enter: needleOnRecord(this.#angle) ? 0 : tonearm.playAngle,
      " ": needleOnRecord(this.#angle) ? 0 : tonearm.playAngle,
    };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    if (this.#drag) this.#cancel();
    this.#setAngle(target);
    this.#request(needleOnRecord(this.#angle));
  };
}

if (!customElements.get("turntable-control"))
  customElements.define("turntable-control", TurntableControl);
