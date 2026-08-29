/**
 * Adapted from the application and portfolio layouts in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function BlueprintPage({
  children,
  className,
  tabIndex = -1,
  ...props
}: ComponentProps<"main">) {
  return (
    <main
      data-slot="blueprint-page"
      tabIndex={tabIndex}
      className={cn(
        "group/layout relative isolate flex min-h-[calc(100dvh-3.25rem)] max-w-screen flex-col overflow-x-clip blueprint-page-stack px-[3px]",
        className,
      )}
      {...props}
    >
      <div
        data-slot="blueprint-rail"
        className="relative mx-auto w-full flex-1 before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:z-10 before:w-px before:bg-line before:content-[''] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:z-10 after:w-px after:bg-line after:content-[''] md:max-w-3xl"
      >
        {children}
      </div>
    </main>
  );
}
