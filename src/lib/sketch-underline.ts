import { createSketchPath } from "./sketch-path";

const svgNamespace = "http://www.w3.org/2000/svg";
const pending = new Set<SketchUnderlineElement>();
let frame: number | undefined;

function schedule(element: SketchUnderlineElement) {
  if (!element.isConnected) return;
  pending.add(element);
  frame ??= requestAnimationFrame(() => {
    frame = undefined;
    // Read every label before writing any SVG, avoiding layout thrashing.
    const updates = [...pending].map((label) => label.measure());
    pending.clear();
    for (const update of updates) update?.();
  });
}

const containers = new Map<Element, Set<SketchUnderlineElement>>();
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    for (const label of containers.get(entry.target) ?? []) schedule(label);
  }
});

class SketchUnderlineElement extends HTMLElement {
  static observedAttributes = ["data-seed"];
  #container?: Element;
  #label: HTMLElement | null = null;
  #svg: SVGSVGElement | null = null;
  #mutations = new MutationObserver(() => schedule(this));
  #geometry = "";
  #seed = "";
  #paths: { element: SVGPathElement; size: string }[] = [];

  connectedCallback() {
    this.#label = this.querySelector("[data-sketch-label]");
    this.#svg = this.querySelector("[data-sketch-lines]");
    if (!this.#label || !this.#svg) return;

    // Non-replaced inline boxes do not report sizes through ResizeObserver.
    // Observe the nearest layout container; the label itself stays inline.
    let container = this.parentElement;
    while (
      container &&
      ["inline", "contents"].includes(getComputedStyle(container).display)
    ) {
      container = container.parentElement;
    }
    if (container) {
      this.#container = container;
      const labels = containers.get(container) ?? new Set();
      labels.add(this);
      containers.set(container, labels);
      resizeObserver.observe(container);
    }
    this.#mutations.observe(this.#label, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    document.fonts.addEventListener("loadingdone", this.#refresh);
    void document.fonts.ready.then(this.#refresh);
    schedule(this);
  }

  disconnectedCallback() {
    pending.delete(this);
    this.#mutations.disconnect();
    document.fonts.removeEventListener("loadingdone", this.#refresh);
    if (this.#container) {
      const labels = containers.get(this.#container);
      labels?.delete(this);
      if (!labels?.size) {
        resizeObserver.unobserve(this.#container);
        containers.delete(this.#container);
      }
    }
  }

  attributeChangedCallback() {
    schedule(this);
  }

  #refresh = () => schedule(this);

  measure(): (() => void) | undefined {
    const label = this.#label;
    const svg = this.#svg;
    if (!this.isConnected || !label || !svg) return;
    const origin = svg.getBoundingClientRect();
    const fontSize = Number.parseFloat(getComputedStyle(label).fontSize);
    const lines = [...label.getClientRects()].filter(
      ({ width, height }) => width > 0 && height > 0,
    );
    const strokes = lines.map((rect, index) => {
      const x = rect.left - origin.left;
      const y = rect.bottom - origin.top - fontSize * 0.12;
      // Longer labels get a taller gesture. Leave clearance before the next line.
      const desiredHeight = Math.min(
        fontSize * 0.65,
        Math.max(fontSize * 0.45, rect.width * 0.035),
      );
      const next = lines[index + 1];
      const height = next
        ? Math.min(
            desiredHeight,
            Math.max(1, next.top - origin.top - y - fontSize * 0.08),
          )
        : desiredHeight;
      return {
        width: rect.width,
        height,
        transform: `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
      };
    });
    const seed = this.dataset.seed ?? label.textContent ?? "";
    const geometry = `${seed}:${JSON.stringify(strokes)}`;
    if (geometry === this.#geometry) return;

    return () => {
      if (seed !== this.#seed) {
        this.#paths = [];
        this.#seed = seed;
      }
      const paths = strokes.map(({ width, height, transform }, index) => {
        let cached = this.#paths[index];
        if (!cached) {
          const element = document.createElementNS(svgNamespace, "path");
          // One normalized dash traces the whole path, regardless of label size.
          element.setAttribute("pathLength", "1");
          cached = { element, size: "" };
          this.#paths[index] = cached;
        }
        const size = `${width}:${height}`;
        if (cached.size !== size) {
          // Use pixel coordinates instead of scaling a dashed, non-scaling stroke.
          cached.element.setAttribute(
            "d",
            createSketchPath(`${seed}:${index}`, width, height),
          );
          cached.size = size;
        }
        cached.element.setAttribute("transform", transform);
        return cached.element;
      });
      svg.replaceChildren(...paths);
      this.#geometry = geometry;
      this.toggleAttribute("data-ready", paths.length > 0);
    };
  }
}

if (!customElements.get("sketch-underline")) {
  customElements.define("sketch-underline", SketchUnderlineElement);
}
