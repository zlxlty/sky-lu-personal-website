/**
 * Adapted from src/components/base/ui/button.tsx in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-(--radius-small) border text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color,transform] duration-(--duration-feedback) ease-(--ease-standard) select-none active:translate-y-px disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground",
        outline:
          "border-(--color-rule-strong) bg-transparent text-foreground hover:bg-(--color-surface)",
        secondary:
          "border-line bg-(--color-surface) text-foreground hover:bg-(--color-surface-raised)",
        ghost:
          "border-transparent bg-transparent text-foreground hover:bg-(--color-surface)",
        destructive:
          "border-(--color-danger) bg-(--color-danger) text-(--color-paper) hover:bg-transparent hover:text-(--color-danger)",
        link: "border-transparent bg-transparent px-0 text-foreground underline decoration-current decoration-[0.08em] underline-offset-[0.18em] active:translate-y-0",
      },
      size: {
        default: "h-9 px-3",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-4",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      data-size={size}
      data-variant={variant}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
