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
  #observer?: IntersectionObserver;
  #nearby = false;
  #intent = false;
  #attempt = 0;
  #retryTimer?: ReturnType<typeof setTimeout>;
  #recovering = false;
  #resumeAt = 0;
  #started = false;

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
    this.#audio.addEventListener(
      "playing",
      () => {
        if (!this.#intent) return this.#audio?.pause();
        if (this.#retryTimer) return;
        this.#recovering = false;
        this.#started = true;
        this.#state("playing");
      },
      {
        signal,
      },
    );
    this.#audio.addEventListener(
      "pause",
      () => {
        // load() pauses during recovery; it does not cancel the listener's intent.
        if (!this.#recovering && this.#intent) this.#stop();
      },
      { signal },
    );
    this.#audio.addEventListener("ended", this.#stop, { signal });
    this.#audio.addEventListener(
      "waiting",
      () => {
        if (this.#intent) this.#state(this.#started ? "buffering" : "loading");
      },
      { signal },
    );
    this.#audio.addEventListener(
      "loadedmetadata",
      () => {
        if (!this.#recovering || !this.#intent || !this.#audio) return;
        this.#audio.currentTime = Math.min(
          this.#resumeAt,
          this.#audio.duration || this.#resumeAt,
        );
        void this.#play();
      },
      { signal },
    );
    this.#audio.addEventListener("error", this.#networkError, { signal });
    // Warm the connection near the footer without downloading any recording.
    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.#nearby = true;
          this.#preconnect();
          this.#observer?.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    this.#observer.observe(this);
    // A touch, pointer press, or keyboard focus expresses listening interest.
    // Keep selection itself lazy: never fetch the rest of the playlist.
    for (const name of ["pointerdown", "focusin"])
      this.#control.addEventListener(name, this.#prepare, { signal });
    window.addEventListener("pagehide", this.#stop, { signal });
    this.#audio.volume = 0.5;
  }

  disconnectedCallback() {
    this.#stop();
    this.#events?.abort();
    this.#observer?.disconnect();
    this.#audio?.removeAttribute("src");
    this.#audio?.load();
  }

  attributeChangedCallback() {
    if (!this.#audio) return;
    this.#stop();
    this.#audio.removeAttribute("src");
    this.#audio.preload = "none";
    this.#started = false;
    this.#audio.load();
    this.#clearError();
    if (this.#nearby) this.#preconnect();
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

  #preconnect() {
    if (!this.dataset.src) return;
    const url = new URL(this.dataset.src, document.baseURI);
    if (url.protocol !== "https:" || url.origin === location.origin) return;
    const existing = Array.from(
      document.querySelectorAll<HTMLLinkElement>('link[rel="preconnect"]'),
    );
    if (
      existing.some(
        (link) => link.href === `${url.origin}/` || link.href === url.origin,
      )
    )
      return;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url.origin;
    document.head.append(link);
  }

  #prepare = () => {
    if (!this.#audio || this.#audio.getAttribute("src")) return;
    this.#audio.preload = "auto";
    this.#source();
  };

  #cancelRetry() {
    clearTimeout(this.#retryTimer);
    this.#retryTimer = undefined;
    this.#recovering = false;
  }

  #stop = () => {
    this.#requestId++;
    this.#intent = false;
    this.#cancelRetry();
    if (LocalRecord.#active === this) LocalRecord.#active = undefined;
    this.#audio?.pause();
    this.#state("paused");
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
    this.#cancelRetry();
    this.#attempt = 0;
    this.#intent = true;
    this.#clearError();
    this.#audio.preload = "auto";
    if (this.#audio.error) {
      const position = this.#audio.currentTime;
      this.#audio.load();
      this.#audio.currentTime = position;
    }
    this.#state("loading");
    await this.#play();
  };

  #play = async () => {
    const request = ++this.#requestId;
    try {
      // Initial playback stays inside the gesture; recovery may be rejected by
      // browser policy, in which case a fresh gesture is offered instead.
      await this.#audio?.play();
    } catch {
      // A later pause can reject an earlier play promise; that is not a failure.
      if (request === this.#requestId && this.isConnected) this.#fail();
    }
  };

  #networkError = () => {
    // Native buffering resumes by itself. Reload only after a terminal network
    // error, twice at most per listening gesture; never retry codec/autoplay errors.
    if (!this.#intent) return;
    if (
      this.#audio?.error?.code !== MediaError.MEDIA_ERR_NETWORK ||
      this.#attempt >= 2
    ) {
      this.#fail();
      return;
    }
    if (!this.#recovering) this.#resumeAt = this.#audio.currentTime;
    this.#cancelRetry();
    this.#recovering = true;
    this.#audio.pause();
    this.#requestId++;
    this.#state("buffering");
    const delay = [1000, 3000][this.#attempt++];
    this.#retryTimer = setTimeout(() => {
      this.#retryTimer = undefined;
      if (this.#intent && this.isConnected) this.#audio?.load();
    }, delay);
  };

  #state(state: "loading" | "buffering" | "playing" | "paused" | "error") {
    this.dataset.audioState = state;
    this.#control?.toggleAttribute("playing", state === "playing");
    if (this.#status) {
      this.#status.textContent = {
        loading: "Loading recording…",
        buffering: "Buffering…",
        playing: "Playing",
        paused: "Paused",
        error: "Unable to play",
      }[state];
    }
  }

  #clearError() {
    if (this.#error) {
      this.#error.hidden = true;
      this.#error.textContent = "";
    }
  }

  #fail() {
    this.#stop();
    this.#state("error");
    if (this.#error) {
      this.#error.hidden = false;
      this.#error.textContent =
        "Unable to play this recording. Lift the arm and place it back on the record to retry.";
    }
  }
}

if (!customElements.get("local-record"))
  customElements.define("local-record", LocalRecord);
