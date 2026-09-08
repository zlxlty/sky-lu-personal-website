import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

/**
 * A two-column grid inside a Panel. The gaps form ruled bands; the containing
 * Panel still owns the outer horizontal edges and the page owns its rails.
 * Render PanelGridItem children directly so row ownership follows grid order.
 */
export function PanelGrid({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-grid"
      className={cn(
        "relative grid gap-4 py-4 sm:grid-cols-2 sm:after:pointer-events-none sm:after:absolute sm:after:inset-y-0 sm:after:left-1/2 sm:after:w-4 sm:after:-translate-x-1/2 sm:after:border-x sm:after:border-(--color-blueprint-rule) sm:after:content-['']",
        className,
      )}
      {...props}
    />
  );
}

/** Only the first cell in each row paints its full-width horizontal rules. */
export function PanelGridItem({
  className,
  ...props
}: ComponentProps<"article">) {
  return (
    <article
      data-slot="panel-grid-item"
      className={cn(
        "screen-line-top screen-line-bottom min-w-0 sm:even:before:hidden sm:even:after:hidden",
        className,
      )}
      {...props}
    />
  );
}
