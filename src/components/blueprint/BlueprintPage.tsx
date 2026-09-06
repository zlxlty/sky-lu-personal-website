/**
 * Adapted from the application and portfolio layouts in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/cn";

export function BlueprintPage({
  children,
  className,
  header,
  footer,
  tabIndex = -1,
  ...props
}: ComponentProps<"main"> & { header?: ReactNode; footer?: ReactNode }) {
  return (
    <div
      data-slot="blueprint-shell"
      className="relative isolate min-h-dvh max-w-screen overflow-x-clip px-[3px]"
    >
      {/* Paint the frame above section and sticky-header backgrounds. */}
      <div
        data-slot="blueprint-rail"
        className="relative mx-auto min-h-dvh px-px after:pointer-events-none after:absolute after:inset-0 after:z-50 after:border-x after:border-(--color-blueprint-rule) md:max-w-3xl"
      >
        {header}
        <main
          data-slot="blueprint-page"
          data-has-header={header ? "" : undefined}
          data-has-footer={footer ? "" : undefined}
          tabIndex={tabIndex}
          className={cn("group/layout panel-stack", className)}
          {...props}
        >
          {children}
        </main>
        {footer && (
          <footer
            id="site-footer"
            data-slot="site-footer"
            className="screen-line-top screen-line-bottom"
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
