/**
 * Adapted from src/registry/components/line-nav/line-nav.tsx in
 * ncdai/chanhdai.com at dc4bf70d7de91bf0531c1897125cfe59d6f1f3e7.
 * Copyright (c) 2026 Chánh Đại. Licensed under the MIT License.
 * The original credits Devouring Details and Skiper UI.
 * Static anchors and CSS replace the original Motion/React lifecycle.
 */
import { SketchUnderline } from "./SketchUnderline";

interface LineNavProps {
  label: string;
  items: readonly { title: string; href: string }[];
  activeHref?: string;
  className?: string;
}

export function LineNav({ label, items, activeHref, className }: LineNavProps) {
  return (
    <nav aria-label={label} data-slot="line-nav" className={className}>
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={item.href === activeHref ? "page" : undefined}
              className="group flex min-h-10 items-center gap-3 py-2 text-sm no-underline"
            >
              <span aria-hidden="true" className="w-8 shrink-0">
                <span className="block h-px origin-left scale-x-60 bg-current transition-transform duration-(--duration-feedback) group-hover:scale-x-100 group-focus-visible:scale-x-100 group-aria-[current=page]:scale-x-100 motion-reduce:transition-none" />
              </span>
              <span className="min-w-0 wrap-anywhere">
                <SketchUnderline text={item.title} seed={item.href} />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
