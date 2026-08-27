import type { ReactElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeAll, describe, expect, it } from "vitest";

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
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
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

const mountedRoots: Root[] = [];

beforeAll(() => {
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", {
    configurable: true,
    value: true,
  });
});

afterEach(async () => {
  for (const root of mountedRoots.splice(0)) {
    await act(async () => {
      root.unmount();
      await Promise.resolve();
    });
  }
  document.body.replaceChildren();
});

describe("static UI primitives", () => {
  it("renders button variants as server HTML", () => {
    const html = renderToStaticMarkup(
      <Button variant="outline" size="sm">
        Read writing
      </Button>,
    );

    expect(html).toContain('data-slot="button"');
    expect(html).toContain('data-variant="outline"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain("Read writing");
  });

  it("composes a badge onto a link without a wrapper", () => {
    const html = renderToStaticMarkup(
      <Badge render={<a href="/writing" />} variant="secondary">
        New
      </Badge>,
    );

    expect(html.startsWith("<a ")).toBe(true);
    expect(html).toContain('href="/writing"');
    expect(html).toContain('data-slot="badge"');
    expect(html).not.toContain("<span");
  });

  it("uses paired semantic tokens for destructive controls", () => {
    const button = renderToStaticMarkup(
      <Button variant="destructive">Delete</Button>,
    );
    const badge = renderToStaticMarkup(
      <Badge variant="destructive">Unavailable</Badge>,
    );

    for (const html of [button, badge]) {
      expect(html).toContain("bg-(--color-danger-emphasis)");
      expect(html).toContain("text-(--color-on-danger)");
      expect(html).not.toContain("text-(--color-paper)");
    }
  });

  it("preserves separator orientation semantics", () => {
    const html = renderToStaticMarkup(<Separator orientation="vertical" />);

    expect(html).toContain('data-slot="separator"');
    expect(html).toContain('data-orientation="vertical"');
    expect(html).toContain('role="separator"');
  });
});

describe("interactive UI primitives", () => {
  it("opens and closes collapsible content through its trigger", async () => {
    const container = await mount(
      <Collapsible>
        <CollapsibleTrigger>Research details</CollapsibleTrigger>
        <CollapsibleContent>Packet scheduling notes</CollapsibleContent>
      </Collapsible>,
    );
    const trigger = getRequired<HTMLButtonElement>(
      container,
      '[data-slot="collapsible-trigger"]',
    );

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(
      getRequired(container, '[data-slot="collapsible-content"]').textContent,
    ).toBe("Packet scheduling notes");

    await click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("portals a dialog, labels it, closes on Escape, and restores focus", async () => {
    const container = await mount(
      <Dialog>
        <DialogTrigger>Open profile</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>Short biography.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    const trigger = getRequired<HTMLButtonElement>(
      container,
      '[data-slot="dialog-trigger"]',
    );
    trigger.focus();
    await click(trigger);

    const dialog = getRequired(document, '[data-slot="dialog-content"]');
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(
      document.querySelector('[data-slot="dialog-overlay"]'),
    ).not.toBeNull();

    const close = getRequired<HTMLButtonElement>(
      document,
      '[data-slot="dialog-close"]',
    );
    expect(close.textContent).toContain("Close");
    await pressKey(document, "Escape");
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("uses the requested side for a sheet portal", async () => {
    const container = await mount(
      <Sheet>
        <SheetTrigger>Open menu</SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Site sections.</SheetDescription>
          </SheetHeader>
        </SheetContent>
      </Sheet>,
    );

    await click(getRequired(container, '[data-slot="sheet-trigger"]'));
    const sheet = getRequired(document, '[data-slot="sheet-content"]');
    expect(sheet.getAttribute("data-side")).toBe("left");
    expect(sheet.getAttribute("role")).toBe("dialog");
    expect(
      document.querySelector('[data-slot="sheet-overlay"]'),
    ).not.toBeNull();
  });

  it("portals visual tooltip content while the trigger keeps its accessible name", async () => {
    const container = await mount(
      <TooltipProvider delay={0}>
        <Tooltip open>
          <TooltipTrigger aria-label="Research status">Status</TooltipTrigger>
          <TooltipContent>Published</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );

    const tooltip = getRequired(document, '[data-slot="tooltip-content"]');
    expect(tooltip.textContent).toContain("Published");
    expect(
      getRequired(container, '[data-slot="tooltip-trigger"]').getAttribute(
        "aria-label",
      ),
    ).toBe("Research status");
  });

  it("exposes command input, listbox, items, and shortcuts", async () => {
    const container = await mount(
      <Command>
        <CommandInput aria-label="Search commands" />
        <CommandList>
          <CommandEmpty>No commands found.</CommandEmpty>
          <CommandGroup heading="Navigate">
            <CommandItem value="writing">
              Writing <CommandShortcut>W</CommandShortcut>
            </CommandItem>
            <CommandItem value="projects">Projects</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>,
    );

    expect(
      getRequired(container, '[data-slot="command-input"]').getAttribute(
        "aria-label",
      ),
    ).toBe("Search commands");
    expect(
      getRequired(container, '[data-slot="command-list"]').getAttribute("role"),
    ).toBe("listbox");
    expect(
      container.querySelectorAll('[data-slot="command-item"]'),
    ).toHaveLength(2);
    expect(
      getRequired(container, '[data-slot="command-shortcut"]').textContent,
    ).toBe("W");
  });

  it("uses the command package's own dialog portal", async () => {
    await mount(
      <CommandDialog
        open
        title="Navigate the site"
        description="Choose a destination."
      >
        <CommandInput aria-label="Search destinations" />
        <CommandList>
          <CommandItem value="writing">Writing</CommandItem>
        </CommandList>
      </CommandDialog>,
    );

    const dialog = getRequired(document, "[cmdk-dialog]");
    expect(dialog.getAttribute("role")).toBe("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Navigate the site");
    expect(dialog.textContent).toContain("Choose a destination.");
  });
});

async function mount(element: ReactElement) {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  mountedRoots.push(root);
  await act(async () => {
    root.render(element);
    await Promise.resolve();
  });
  return container;
}

async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true }),
    );
    await Promise.resolve();
  });
}

async function pressKey(target: EventTarget, key: string) {
  await act(async () => {
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));
    await Promise.resolve();
  });
}

function getRequired<TElement extends Element = HTMLElement>(
  parent: Document | Element,
  selector: string,
) {
  const element = parent.querySelector<TElement>(selector);
  if (!element) throw new Error(`Missing test element: ${selector}`);
  return element;
}
