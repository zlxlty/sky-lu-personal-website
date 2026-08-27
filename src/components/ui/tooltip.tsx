/**
 * Adapted from src/components/base/ui/tooltip.tsx in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/cn";

function TooltipProvider({
  delay = 300,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider delay={delay} {...props} />;
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger(props: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  align = "center",
  alignOffset = 0,
  children,
  className,
  side = "top",
  sideOffset = 8,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-60"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "z-60 w-fit max-w-xs origin-(--transform-origin) rounded-(--radius-small) bg-foreground px-3 py-1.5 text-xs leading-(--leading-meta) text-background shadow-lg transition-[opacity,transform] duration-(--duration-disclosure) ease-(--ease-standard) data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 motion-reduce:transition-none",
            className,
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="size-2.5 rotate-45 rounded-[1px] bg-foreground" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
