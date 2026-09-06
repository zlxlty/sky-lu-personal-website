import { getCollection } from "astro:content";

import { newestFirst, publishedEntries } from "@/lib/content";

export async function getWriting() {
  return publishedEntries(await getCollection("blog")).toSorted(newestFirst);
}

export async function getProjects() {
  return publishedEntries(await getCollection("projects")).toSorted(
    (a, b) => a.data.order - b.data.order || a.id.localeCompare(b.id, "en"),
  );
}
