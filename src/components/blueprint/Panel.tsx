/**
 * Adapted from src/features/portfolio/components/panel.tsx in
 * ncdai/chanhdai.com at b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

/**
 * A horizontally divided stack. BlueprintPage owns the continuous vertical
 * rails; normal adjacent sections share one horizontal separator, and a
 * direct-child PanelRuleBand owns its paired separators.
 */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return (
    <section
      data-slot="panel"
      className={cn("panel-stack border-x border-transparent", className)}
      {...props}
    />
  );
}

export function PanelHeader({ className, ...props }: ComponentProps<"header">) {
  return (
    <header
      data-slot="panel-header"
      className={cn(
        "px-4 has-data-[slot=panel-description]:*:data-[slot=panel-title]:screen-line-bottom",
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      data-slot="panel-title"
      className={cn(
        "font-heading text-3xl font-medium tracking-tight text-balance",
        className,
      )}
      {...props}
    />
  );
}

export function PanelTitleSup({ className, ...props }: ComponentProps<"sup">) {
  return (
    <sup
      className={cn(
        "top-[-0.75em] ml-1 text-sm font-medium tracking-normal text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function PanelDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-description"
      className={cn(
        "py-4 text-base text-balance text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function PanelContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-body"
      className={cn("px-4 py-4", className)}
      {...props}
    />
  );
}

export function PanelRuleBand({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-rule-band"
      className={cn(
        "screen-line-top screen-line-bottom col-span-full h-4",
        className,
      )}
      {...props}
      aria-hidden="true"
    />
  );
}
