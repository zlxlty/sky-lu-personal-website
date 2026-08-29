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
      className={cn(
        "sticky top-0 z-50 max-w-screen overflow-x-clip bg-background/95 px-[3px] backdrop-blur-sm",
        className,
      )}
      {...props}
    >
      <div
        data-slot="site-header-rail"
        className="screen-line-top screen-line-bottom mx-auto flex h-13 items-center justify-between border-x border-line px-2 md:max-w-3xl"
      >
        {children}
      </div>
    </header>
  );
}
