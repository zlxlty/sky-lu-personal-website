/**
 * Adapted from src/components/ui/command.tsx in ncdai/chanhdai.com at
 * b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 */
import type { ComponentProps } from "react";
import { Command as CommandPrimitive } from "cmdk";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

function Command({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full min-h-0 flex-col overflow-hidden text-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandDialog({
  children,
  contentClassName,
  defaultOpen,
  description = "Search for a command to run.",
  finalFocus,
  initialFocus,
  onOpenChange,
  open,
  title = "Command palette",
  ...props
}: ComponentProps<typeof Command> &
  Pick<ComponentProps<typeof Dialog>, "open" | "defaultOpen" | "onOpenChange"> &
  Pick<ComponentProps<typeof DialogContent>, "initialFocus" | "finalFocus"> & {
    contentClassName?: string;
    description?: string;
    title?: string;
  }) {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="command-dialog"
        initialFocus={initialFocus}
        finalFocus={finalFocus}
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 overflow-hidden p-0 sm:max-w-lg",
          contentClassName,
        )}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <Command label={title} {...props}>
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandInput({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="relative flex h-11 shrink-0 items-center gap-2 border-b border-line px-3 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:border-(--color-focus) has-[:focus-visible]:after:border-b-(length:--focus-width) forced-colors:after:border-[Highlight]"
    >
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "h-10 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CommandList({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-80 min-h-0 scroll-py-2 overflow-x-hidden overflow-y-auto overscroll-contain p-1 outline-none",
        className,
      )}
      {...props}
    />
  );
}

function CommandEmpty(props: ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-8 text-center font-mono text-sm text-muted-foreground"
      {...props}
    />
  );
}

function CommandGroup({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden px-1 py-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase",
        className,
      )}
      {...props}
    />
  );
}

function CommandSeparator({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-line", className)}
      {...props}
    />
  );
}

function CommandItem({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "relative flex min-h-9 cursor-default items-center gap-2 rounded-(--radius-small) px-2 py-1.5 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-(--color-surface) [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function CommandShortcut({ className, ...props }: ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto font-mono text-xs tracking-widest text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};
