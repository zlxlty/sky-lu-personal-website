export interface RecordTrack {
  readonly id: string;
  readonly audioSrc: string;
  readonly title: string;
  readonly author: string;
  readonly record?: string;
  readonly recordUrl?: string;
  readonly videoUrl?: string;
  readonly license?: { readonly label: string; readonly href: string };
}

/** Validate authored records during the build, before they reach a browser. */
export function definePlaylist(
  tracks: readonly RecordTrack[],
): readonly RecordTrack[] {
  const ids = new Set<string>();
  for (const track of tracks) {
    if (!track.id.trim() || ids.has(track.id))
      throw new Error(`Record IDs must be nonempty and unique: ${track.id}`);
    ids.add(track.id);
    if (!track.title.trim() || !track.author.trim())
      throw new Error(`Record ${track.id} needs a title and author.`);
    for (const url of [
      track.audioSrc,
      track.recordUrl,
      track.videoUrl,
      track.license?.href,
    ]) {
      if (url === undefined) continue;
      let valid = /^(https:\/\/|\/(?!\/))\S+$/.test(url);
      try {
        const parsed = new URL(url, "https://local.invalid");
        valid &&=
          parsed.protocol === "https:" && !parsed.username && !parsed.password;
      } catch {
        valid = false;
      }
      if (!valid)
        throw new Error(
          `Record ${track.id} needs an HTTPS URL or site-relative path without credentials.`,
        );
    }
  }
  return tracks;
}
