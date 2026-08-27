import { useEffect, useRef, useState, type ComponentProps } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

export function LabControls() {
  const [commandOpen, setCommandOpen] = useState(false);
  const controlsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    controlsRef.current?.setAttribute("data-hydrated", "true");
  }, []);

  return (
    <TooltipProvider>
      <div
        ref={controlsRef}
        data-slot="lab-controls"
        className="grid gap-4 sm:grid-cols-2"
      >
        <Specimen
          title="Buttons"
          description="Public variants, sizing, and unavailable actions."
        >
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Text link</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button>Default size</Button>
            <Button size="lg">Large</Button>
            <Button disabled aria-busy="true">
              Saving…
            </Button>
          </div>
        </Specimen>

        <Specimen
          title="Badges"
          description="Compact metadata without adding an icon package."
        >
          <div className="flex flex-wrap gap-2">
            <Badge>Available</Badge>
            <Badge variant="secondary">Research</Badge>
            <Badge variant="outline">In progress</Badge>
            <Badge variant="destructive">Unavailable</Badge>
          </div>
          <Separator />
          <p className="m-0 text-sm text-muted-foreground">
            Separators preserve orientation semantics while visual rules remain
            token-driven.
          </p>
        </Specimen>

        <Specimen
          title="Disclosure"
          description="Open by default so its content remains easy to inspect."
        >
          <Collapsible defaultOpen className="grid gap-2">
            <CollapsibleTrigger
              render={<Button variant="outline" className="justify-between" />}
            >
              Network research details
              <span aria-hidden="true" className="font-mono text-xs">
                F
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent className="rounded-(--radius-small) border border-line bg-(--color-surface) p-3 text-sm text-muted-foreground">
              Hidden content is associated with the trigger and responds to both
              pointer and keyboard input.
            </CollapsibleContent>
          </Collapsible>
        </Specimen>

        <Specimen
          title="Tooltip and focus"
          description="Tab to the trigger or hover it to inspect delayed help."
        >
          <div className="flex flex-wrap gap-2">
            <Tooltip>
              <TooltipTrigger
                render={<Button variant="outline" />}
                aria-label="Research publication status"
              >
                Publication status
              </TooltipTrigger>
              <TooltipContent>Public preprint available</TooltipContent>
            </Tooltip>
            <Button variant="ghost">Keyboard focus target</Button>
          </div>
          <p className="m-0 font-mono text-xs text-muted-foreground">
            Focus rings use the active theme token and remain visible in forced
            colors.
          </p>
        </Specimen>

        <Specimen
          title="Overlays"
          description="Focus-managed dialog and four-direction sheet primitives."
        >
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger render={<Button variant="outline" />}>
                Open dialog
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Research note</DialogTitle>
                  <DialogDescription>
                    Dialog focus stays inside this surface until it closes.
                  </DialogDescription>
                </DialogHeader>
                <p className="m-0 text-sm text-muted-foreground">
                  Press Escape or use either close action. Focus returns to the
                  trigger afterward.
                </p>
                <DialogFooter>
                  <DialogClose render={<Button variant="outline" />}>
                    Close dialog
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Sheet>
              <SheetTrigger render={<Button variant="outline" />}>
                Open sheet
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Navigation specimen</SheetTitle>
                  <SheetDescription>
                    The narrow panel adapts to mobile and desktop widths.
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-2 px-4 text-sm">
                  <Button variant="ghost" className="justify-start">
                    Writing
                  </Button>
                  <Button variant="ghost" className="justify-start">
                    Projects
                  </Button>
                  <Button variant="ghost" className="justify-start">
                    Jazz
                  </Button>
                </div>
                <SheetFooter>
                  <SheetClose render={<Button variant="outline" />}>
                    Close sheet
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </Specimen>

        <Specimen
          title="Command menu"
          description="Inline filtering and the future global palette surface."
        >
          <Command className="h-auto rounded-(--radius-medium) border border-(--color-rule-strong) bg-(--color-surface-raised)">
            <CommandInput
              aria-label="Filter lab destinations"
              placeholder="Filter destinations…"
            />
            <CommandList>
              <CommandEmpty>No destination found.</CommandEmpty>
              <CommandGroup heading="Navigate">
                <CommandItem value="writing">
                  Writing <CommandShortcut>W</CommandShortcut>
                </CommandItem>
                <CommandItem value="projects">
                  Projects <CommandShortcut>P</CommandShortcut>
                </CommandItem>
                <CommandItem value="jazz">
                  Jazz <CommandShortcut>J</CommandShortcut>
                </CommandItem>
              </CommandGroup>
              <CommandGroup
                heading="Actions"
                className="border-t border-line pt-1"
              >
                <CommandItem value="toggle theme">Toggle theme</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>

          <Button variant="outline" onClick={() => setCommandOpen(true)}>
            Open command dialog
          </Button>
          <CommandDialog
            open={commandOpen}
            onOpenChange={setCommandOpen}
            title="Navigate the component lab"
            description="Filter the available development destinations."
          >
            <CommandInput placeholder="Search destinations…" />
            <CommandList>
              <CommandEmpty>No destination found.</CommandEmpty>
              <CommandGroup heading="Navigate">
                {[
                  ["Writing", "W"],
                  ["Projects", "P"],
                  ["Jazz", "J"],
                ].map(([label, shortcut]) => (
                  <CommandItem
                    key={label}
                    value={label.toLowerCase()}
                    onSelect={() => setCommandOpen(false)}
                  >
                    {label}
                    <CommandShortcut>{shortcut}</CommandShortcut>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </Specimen>
      </div>
    </TooltipProvider>
  );
}

function Specimen({
  children,
  className,
  description,
  title,
  ...props
}: ComponentProps<"section"> & { description: string; title: string }) {
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-(--radius-medium) border border-line bg-background p-4",
        className,
      )}
      {...props}
    >
      <header className="grid gap-1">
        <h3 className="font-heading text-lg leading-tight font-medium">
          {title}
        </h3>
        <p className="m-0 text-sm text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  );
}
