/**
 * Adapted from src/components/base/ui/sheet.tsx in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog";

import { Button } from "@/components/ui/button";
import { CloseIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function Sheet(props: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}

function SheetTrigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function SheetClose(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function SheetPortal(props: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-(--color-overlay) opacity-100 transition-opacity duration-(--duration-disclosure) ease-(--ease-standard) data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

function SheetContent({
  children,
  className,
  showCloseButton = true,
  side = "right",
  ...props
}: SheetPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col gap-4 border-line bg-(--color-surface-raised) text-sm text-foreground shadow-[0_1rem_4rem_rgb(0_0_0/20%)] transition-transform duration-(--duration-disclosure) ease-(--ease-standard) outline-none motion-reduce:transition-none",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:max-h-[85vh] data-[side=top]:border-b data-[side=top]:data-ending-style:-translate-y-full data-[side=top]:data-starting-style:-translate-y-full",
          "data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-4/5 data-[side=right]:border-l data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full sm:data-[side=right]:max-w-sm",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:max-h-[85vh] data-[side=bottom]:border-t data-[side=bottom]:data-ending-style:translate-y-full data-[side=bottom]:data-starting-style:translate-y-full",
          "data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-4/5 data-[side=left]:border-r data-[side=left]:data-ending-style:-translate-x-full data-[side=left]:data-starting-style:-translate-x-full sm:data-[side=left]:max-w-sm",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
              />
            }
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

function SheetFooter({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-lg leading-tight font-medium",
        className,
      )}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("m-0 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
};
