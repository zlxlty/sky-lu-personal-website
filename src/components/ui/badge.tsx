import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex min-h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-(--radius-round) border px-2 py-0.5 font-mono text-xs leading-none font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-foreground bg-foreground text-background",
        secondary: "border-line bg-(--color-surface) text-muted-foreground",
        outline: "border-(--color-rule-strong) bg-transparent text-foreground",
        destructive:
          "border-(--color-danger-emphasis) bg-(--color-danger-emphasis) text-(--color-on-danger)",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  render,
  variant = "default",
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    render,
    props: {
      "data-slot": "badge",
      "data-variant": variant,
      className: cn(badgeVariants({ variant, className })),
      ...props,
    },
  });
}

export { Badge, badgeVariants };
