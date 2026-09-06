/** One publication rule for page paths, indexes, and future feeds/search. */
export function publishedEntries<T extends { data: { draft: boolean } }>(
  entries: readonly T[],
): T[] {
  return entries.filter((entry) => !entry.data.draft);
}

export function newestFirst(
  a: { id: string; data: { publishedAt: Date } },
  b: { id: string; data: { publishedAt: Date } },
) {
  return (
    b.data.publishedAt.getTime() - a.data.publishedAt.getTime() ||
    a.id.localeCompare(b.id, "en")
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export function formatContentDate(date: Date) {
  return dateFormat.format(date);
}
