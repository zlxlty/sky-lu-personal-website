import type { Page } from "@playwright/test";

interface StartedNote {
  when: number;
  offset: number;
  rate: number;
  disconnected: boolean;
}
declare global {
  interface Window {
    guitarAudioProbe: { contexts: AudioContext[]; notes: StartedNote[] };
  }
}

/** Observe real browser audio scheduling without recording system output. */
export async function observeGuitarAudio(page: Page) {
  await page.addInitScript(() => {
    const probe = {
      contexts: [] as AudioContext[],
      notes: [] as StartedNote[],
    };
    window.guitarAudioProbe = probe;
    const Original = window.AudioContext;
    window.AudioContext = class extends Original {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts.push(this);
      }
      createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        const disconnect = source.disconnect.bind(source);
        let note: StartedNote | undefined;
        source.start = (...args) => {
          // Ignore Tone's tiny constant buffers; observe scheduled sample voices.
          if (source.buffer && source.buffer.duration > 0.5) {
            note = {
              when: args[0] ?? 0,
              offset: args[1] ?? 0,
              get rate() {
                return source.playbackRate.value;
              },
              disconnected: false,
            };
            probe.notes.push(note);
          }
          start(...args);
        };
        source.disconnect = () => {
          if (note) note.disconnected = true;
          disconnect();
        };
        return source;
      }
    };
  });
}

export const guitarNotes = (page: Page) =>
  page.evaluate(() => window.guitarAudioProbe.notes);
