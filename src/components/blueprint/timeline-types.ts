export interface TimelineEntry {
  /** ISO year-month, e.g. 2027-05. Entries render in the supplied order. */
  date: string;
  title: string;
  description: readonly (string | { text: string; href: string })[];
}
