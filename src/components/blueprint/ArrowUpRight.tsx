import { cn } from "@/lib/cn";

/** A text-sized link arrow that never falls back to an emoji font. */
export function ArrowUpRight({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("inline-block size-[1em] shrink-0", className)}
    >
      <path d="M3 13 13 3M5 3h8v8" />
    </svg>
  );
}
