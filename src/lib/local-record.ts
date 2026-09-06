import { TurntableControl } from "./turntable-control";
import type { RecordDirection } from "./vinyl-selector";

/** Native media owns playback; gestures express intent and never fake playing state. */
class LocalRecord extends HTMLElement {
  static observedAttributes = ["data-src"];
  static #active: LocalRecord | undefined;
  #audio: HTMLAudioElement | null = null;
  #control: TurntableControl | null = null;
  #status: HTMLElement | null = null;
  #error: HTMLElement | null = null;
  #events?: AbortController;
  #requestId = 0;
  #tracks: HTMLElement[] = [];
  #index = 0;

  connectedCallback() {
    this.#audio = this.querySelector("audio");
    const control = this.querySelector("turntable-control");
    this.#control = control instanceof TurntableControl ? control : null;
    this.#tracks = Array.from(
      this.querySelectorAll<HTMLElement>("[data-record-track]"),
    );
    this.#status = this.querySelector("[data-audio-status]");
    this.#error = this.querySelector("[data-audio-error]");
    if (!this.#audio || !this.#control) return;
    this.#events = new AbortController();
    const { signal } = this.#events;
    this.addEventListener(
      "turntable-record-change",
      (event) => this.#select(event.detail.direction),
      { signal },
    );
    this.addEventListener(
      "turntable-playback-request",
      (event) => {
        void this.#request(event);
      },
      {
        signal,
      },
    );
    this.#audio.addEventListener(
      "play",
      () => {
        const previous = LocalRecord.#active;
        if (previous && previous !== this) previous.#stop();
        LocalRecord.#active = this;
      },
      { signal },
    );
    this.#audio.addEventListener("playing", () => this.#state(true), {
      signal,
    });
    for (const name of ["pause", "ended", "waiting", "emptied"])
      this.#audio.addEventListener(name, () => this.#state(false), { signal });
    this.#audio.addEventListener("error", () => this.#fail(), { signal });
    window.addEventListener("pagehide", this.#stop, { signal });
    this.#audio.volume = 0.5;
  }

  disconnectedCallback() {
    this.#stop();
    this.#events?.abort();
    this.#audio?.removeAttribute("src");
    this.#audio?.load();
  }

  attributeChangedCallback() {
    if (!this.#audio) return;
    this.#stop();
    this.#audio.removeAttribute("src");
    this.#audio.load();
    this.#clearError();
  }

  #select(direction: RecordDirection) {
    if (this.#tracks.length < 2) return;
    this.#index =
      (this.#index + direction + this.#tracks.length) % this.#tracks.length;
    const track = this.#tracks[this.#index];
    if (!track?.dataset.src) return;
    this.#tracks.forEach((item, index) => {
      item.toggleAttribute("data-active", index === this.#index);
      item.inert = index !== this.#index;
    });
    // Selecting does not fetch or autoplay. A fresh arm gesture starts the new recording.
    this.setAttribute("data-src", track.dataset.src);
    this.#control?.setAttribute("record-design", String(this.#index));
    if (this.#status)
      this.#status.textContent = `${track.dataset.title}. Record ${this.#index + 1} of ${this.#tracks.length}. Ready to play.`;
  }

  #source() {
    const src = this.dataset.src;
    if (!src || !this.#audio) return false;
    if (!this.#audio.getAttribute("src")) this.#audio.src = src;
    return true;
  }

  #stop = () => {
    this.#requestId++;
    if (LocalRecord.#active === this) LocalRecord.#active = undefined;
    this.#audio?.pause();
    this.#state(false);
  };

  #request = async (
    event: HTMLElementEventMap["turntable-playback-request"],
  ) => {
    if (!event.detail.playing) {
      this.#stop();
      return;
    }
    if (!this.#audio || !this.#source()) {
      this.#fail();
      return;
    }
    const request = ++this.#requestId;
    this.#clearError();
    try {
      // Called in the pointer/keyboard gesture, preserving browser activation.
      await this.#audio.play();
    } catch {
      // A later pause can reject an earlier play promise; that is not a failure.
      if (request === this.#requestId && this.isConnected) this.#fail();
    }
  };

  #state(playing: boolean) {
    this.#control?.toggleAttribute("playing", playing);
    if (this.#status) this.#status.textContent = playing ? "Playing" : "Paused";
  }

  #clearError() {
    if (this.#error) {
      this.#error.hidden = true;
      this.#error.textContent = "";
    }
  }

  #fail() {
    this.#state(false);
    if (this.#error) {
      this.#error.hidden = false;
      this.#error.textContent =
        "Unable to play this recording. Lift the arm and place it back on the record to retry.";
    }
  }
}

if (!customElements.get("local-record"))
  customElements.define("local-record", LocalRecord);
