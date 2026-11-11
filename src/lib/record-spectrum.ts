import { bandCount } from "./spectrum-bands";
import { publishSpectrum } from "./spectrum-sources";

interface RecordingSpectrum {
  readonly framesPerSecond: number;
  readonly frames: Uint8Array;
}

/** Read `pnpm recordings spectra` output; undefined when made for other bands. */
export function parseRecordingSpectrum(
  buffer: ArrayBuffer,
): RecordingSpectrum | undefined {
  const bytes = new Uint8Array(buffer);
  const framesPerSecond = bytes[1];
  if (bytes[0] !== bandCount || !framesPerSecond) return undefined;
  return { framesPerSecond, frames: bytes.subarray(2) };
}

/** Raise `levels` to the recording's band levels at `seconds`. */
export function sampleRecordingSpectrum(
  levels: Float32Array,
  { framesPerSecond, frames }: RecordingSpectrum,
  seconds: number,
) {
  const position = Math.max(0, seconds * framesPerSecond);
  const frame = Math.floor(position);
  const blend = position - frame;
  for (let band = 0; band < bandCount; band++) {
    const from = frames[frame * bandCount + band] ?? 0;
    const to = frames[(frame + 1) * bandCount + band] ?? 0;
    levels[band] = Math.max(
      levels[band] ?? 0,
      (from + (to - from) * blend) / 255,
    );
  }
}

/**
 * Publish the footer record while it plays. The recordings' host sends no CORS
 * headers, so the browser cannot analyse them; each one's spectrum is computed
 * ahead of time and read back at the playback position.
 */
export function followRecord(
  spectra: Readonly<Record<string, string>>,
  signal: AbortSignal,
) {
  const loaded = new Map<string, Promise<RecordingSpectrum | undefined>>();
  let following: HTMLAudioElement | undefined;
  let unpublish: (() => void) | undefined;
  let request = 0;
  const stop = () => {
    request++;
    following = undefined;
    unpublish?.();
    unpublish = undefined;
  };
  const start = async (audio: HTMLAudioElement) => {
    stop();
    following = audio;
    const current = request;
    const url =
      spectra[audio.closest<HTMLElement>("local-record")?.dataset.src ?? ""];
    if (!url) return;
    let pending = loaded.get(url);
    if (!pending) {
      pending = fetch(url, { signal })
        .then((response) => {
          if (!response.ok) throw new Error("Spectrum unavailable");
          return response.arrayBuffer();
        })
        .then(parseRecordingSpectrum)
        .catch(() => {
          // The waves are decoration: a failed download leaves them at rest.
          loaded.delete(url);
          return undefined;
        });
      loaded.set(url, pending);
    }
    const spectrum = await pending;
    if (!spectrum || current !== request || signal.aborted) return;
    unpublish = publishSpectrum({
      read(levels) {
        // A stalled download holds the playback position; show silence.
        if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA)
          sampleRecordingSpectrum(levels, spectrum, audio.currentTime);
      },
    });
  };
  const follow = (event: Event) => {
    const audio = event.target;
    if (!(audio instanceof HTMLAudioElement) || !audio.closest("local-record"))
      return;
    if (event.type === "playing") void start(audio);
    else if (event.type !== "timeupdate") stop();
    // A record already playing when this page arrived announces nothing new;
    // its next progress report is the first sign of it.
    else if (following !== audio && !audio.paused) void start(audio);
  };
  // Media events do not bubble; capture them on their way down.
  for (const type of ["playing", "timeupdate", "pause", "ended", "emptied"])
    document.addEventListener(type, follow, { capture: true, signal });
  signal.addEventListener("abort", stop);
}
