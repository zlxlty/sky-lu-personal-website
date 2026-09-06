/**
 * Adapted from the portfolio Separator in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";

import { cn } from "@/lib/cn";

export function StripeSeparator({
  className,
  ...props
}: Omit<ComponentProps<"div">, "children" | "aria-hidden">) {
  return (
    <div
      aria-hidden="true"
      data-slot="stripe-separator"
      data-blueprint-edge=""
      className={cn("screen-line-top screen-line-bottom h-8", className)}
      {...props}
    >
      <span
        data-slot="stripe-pattern"
        className="pointer-events-none absolute inset-y-px left-[-100vw] z-0 w-[200vw] diagonal-stripes"
      />
    </div>
  );
}
