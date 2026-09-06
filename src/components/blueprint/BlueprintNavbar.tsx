/**
 * Adapted from src/components/site-header.tsx in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function BlueprintNavbar({
  children,
  className,
  ...props
}: ComponentProps<"header">) {
  return (
    <header
      data-slot="site-header"
      className={cn("sticky top-0 z-50", className)}
      {...props}
    >
      {/* Mask scrolling content in the gutters as well as inside the rail. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-[-100vw] -z-1 w-[200vw] bg-background/95 backdrop-blur-sm"
      />
      <div
        data-slot="site-header-rail"
        className="screen-line-top screen-line-bottom flex h-13 items-center px-2"
      >
        <div className="flex-1" aria-hidden="true" />
        {children}
      </div>
    </header>
  );
}
