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
}: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="stripe-separator"
      className={cn("stripe-divider w-full border-x border-line", className)}
      {...props}
    />
  );
}
