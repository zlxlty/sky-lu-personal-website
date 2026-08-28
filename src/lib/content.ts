type DraftableEntry = {
  readonly data: {
    readonly draft: boolean;
  };
};

type DraftFilterOptions = {
  readonly includeDrafts?: boolean;
};

export function filterDraftEntries<T extends DraftableEntry>(
  entries: readonly T[],
  { includeDrafts = false }: DraftFilterOptions = {},
): T[] {
  return includeDrafts
    ? Array.from(entries)
    : entries.filter(({ data }) => !data.draft);
}
