import { createElement } from "react";

interface SketchUnderlineProps {
  text: string;
  /** Stable identity; defaults to the label. Different seeds produce different gestures. */
  seed?: string;
}

/** Static text with an optional, independently enhanced decorative underline. */
export function SketchUnderline({ text, seed = text }: SketchUnderlineProps) {
  return createElement(
    "sketch-underline",
    { "data-seed": seed },
    <span data-sketch-label>{text}</span>,
    <svg
      data-sketch-lines
      aria-hidden="true"
      focusable="false"
      width="100%"
      height="100%"
    />,
  );
}
