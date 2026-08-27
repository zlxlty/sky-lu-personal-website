/**
 * Adapted from src/features/portfolio/components/handwritten-note.tsx in
 * ncdai/chanhdai.com at b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

type RailAnnotationSide = "left" | "right";
type RailAnnotationAlign = "start" | "center" | "end";
type RailAnnotationArrowDirection = "up" | "down";

type RailAnnotationProps = Omit<ComponentProps<"div">, "aria-hidden"> & {
  side: RailAnnotationSide;
  align?: RailAnnotationAlign;
  arrowDirection?: RailAnnotationArrowDirection;
};

const alignmentClasses: Record<RailAnnotationAlign, string> = {
  start: "top-4",
  center: "top-1/2 -translate-y-1/2",
  end: "bottom-4",
};

/**
 * Places a decorative handwritten note in either outer gutter of a positioned
 * content-rail ancestor. The note is hidden when the gutters are too narrow.
 */
export function RailAnnotation({
  side,
  align = "center",
  arrowDirection = "down",
  children,
  className,
  ...props
}: RailAnnotationProps) {
  return (
    <div
      data-slot="rail-annotation"
      data-side={side}
      data-align={align}
      data-arrow-direction={arrowDirection}
      className={cn(
        "pointer-events-none absolute z-10 hidden w-40 flex-col font-handwritten text-2xl/none tracking-normal text-muted-foreground opacity-70 select-none xl:flex print:hidden",
        alignmentClasses[align],
        side === "left"
          ? "right-full mr-3 items-end text-right"
          : "left-full ml-3 items-start text-left",
        className,
      )}
      {...props}
      aria-hidden="true"
    >
      {arrowDirection === "up" && (
        <RailAnnotationArrow side={side} direction={arrowDirection} />
      )}
      <span
        data-slot="rail-annotation-copy"
        className={cn(
          side === "left"
            ? "origin-top-right rotate-2"
            : "origin-top-left -rotate-2",
        )}
      >
        {children}
      </span>
      {arrowDirection === "down" && (
        <RailAnnotationArrow side={side} direction={arrowDirection} />
      )}
    </div>
  );
}

function RailAnnotationArrow({
  side,
  direction,
}: {
  side: RailAnnotationSide;
  direction: RailAnnotationArrowDirection;
}) {
  return (
    <svg
      data-slot="rail-annotation-arrow"
      className={cn(
        "size-9 shrink-0",
        direction === "up" ? "mb-1 -scale-y-100" : "mt-1",
        side === "left"
          ? "translate-x-3 -scale-x-100 rotate-6"
          : "-translate-x-3 -rotate-6",
      )}
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M34 4c1 15-5 26-21 30" />
      <path d="m21 36-8-2 7-7" />
    </svg>
  );
}
