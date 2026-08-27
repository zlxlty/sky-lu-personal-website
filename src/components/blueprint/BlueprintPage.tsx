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
        "group/layout relative isolate min-h-screen max-w-screen overflow-x-clip px-[3px] blueprint-page-stack",
        className,
      )}
      {...props}
    >
      <div data-slot="blueprint-rail" className="mx-auto md:max-w-3xl">
        {children}
      </div>
    </main>
  );
}
