import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGuitarAudio } from "@/components/guitar/audio/guitar-audio";
import type { GuitarSampleBank } from "@/components/guitar/audio/sample-bank";

const fake = vi.hoisted(() => {
  class Source {
    static all: Source[] = [];
    start = vi.fn();
    stop = vi.fn();
    dispose = vi.fn();
    constructor(readonly options: { url: unknown; playbackRate: number }) {
      Source.all.push(this);
    }
    connect() {
      return this;
    }
  }
  const resume = vi.fn(() => Promise.resolve());
  const close = vi.fn(() => Promise.resolve());
  const decode = vi.fn((bytes: ArrayBuffer) => Promise.resolve({ bytes }));
  return { Source, resume, close, decode };
});

vi.mock("tone", () => ({
  getContext: () => ({ dispose: vi.fn() }),
  Context: class {
    now() {
      return 10.005;
    }
    close = fake.close;
    dispose = vi.fn();
  },
  setContext: vi.fn(),
  Gain: class {
    gain = { rampTo: vi.fn() };
    connect() {
      return this;
    }
    dispose = vi.fn();
  },
  Limiter: class {
    toDestination() {
      return this;
    }
    dispose = vi.fn();
  },
  ToneBufferSource: fake.Source,
}));

const bank: GuitarSampleBank = {
  id: "test",
  gain: 0.8,
  samples: [1, 2].map((take) => ({
    url: `/take-${take}.wav`,
    stringIndex: 0,
    midi: 64,
    rootMidi: 63,
    low: 0,
    high: 1,
    take,
    offset: 0.002,
  })),
};
const note = { index: 0, strength: 0.6, delay: 0 };
let engine: ReturnType<typeof createGuitarAudio> | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  fake.Source.all = [];
  vi.stubGlobal(
    "AudioContext",
    class {
      currentTime = 10;
      state = "running";
      resume = fake.resume;
      close = fake.close;
      decodeAudioData = fake.decode;
    },
  );
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(new ArrayBuffer(8)))),
  );
});
afterEach(() => {
  engine?.dispose();
  engine = undefined;
  vi.unstubAllGlobals();
});

describe("guitar audio lifecycle", () => {
  it("unlocks synchronously but loads no recordings until requested", async () => {
    engine = createGuitarAudio();
    expect(fake.resume).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
    await engine.pluck(note);
    expect(fake.Source.all).toHaveLength(0);
    await engine.load(bank);
    await engine.load(bank);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fake.decode).toHaveBeenCalledTimes(2);
  });

  it("alternates takes, transposes roots, and damps the previous note on that string", async () => {
    engine = createGuitarAudio();
    await engine.load(bank);
    for (let i = 0; i < 3; i++) await engine.pluck(note);
    const [first, second, third] = fake.Source.all;
    expect(first?.options.url).not.toBe(second?.options.url);
    expect(first?.options.url).toBe(third?.options.url);
    expect(first?.options.playbackRate).toBeCloseTo(2 ** (1 / 12));
    expect(first?.stop).toHaveBeenCalledWith(10.005);
    expect(first?.start).toHaveBeenCalledWith(
      10.005,
      0.002,
      undefined,
      expect.any(Number),
    );
  });

  it("cancels plucks awaiting the engine and disposes future scheduled notes", async () => {
    engine = createGuitarAudio();
    await engine.load(bank);
    const pending = engine.pluck(note);
    engine.stop();
    await pending;
    expect(fake.Source.all).toHaveLength(0);
    await engine.pluck({ ...note, delay: 2 });
    expect(fake.Source.all[0]?.start).toHaveBeenCalledWith(
      12.005,
      0.002,
      undefined,
      expect.any(Number),
    );
    engine.stop();
    expect(fake.Source.all[0]?.dispose).toHaveBeenCalledOnce();
  });

  it("does not start an old note after a bank change", async () => {
    engine = createGuitarAudio();
    await engine.load(bank);
    const pending = engine.pluck(note);
    await engine.load({ ...bank, id: "other" });
    await pending;
    expect(fake.Source.all).toHaveLength(0);
    await engine.pluck(note);
    expect(fake.Source.all).toHaveLength(1);
  });

  it("aborts pending downloads on disposal and cannot play afterward", async () => {
    let signal: AbortSignal | null | undefined;
    let respond: ((value: Response) => void) | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, options: RequestInit) => {
        signal = options.signal;
        return new Promise<Response>((resolve) => {
          respond = resolve;
        });
      }),
    );
    engine = createGuitarAudio();
    const loading = engine.load({ ...bank, samples: bank.samples.slice(0, 1) });
    await vi.waitFor(() => expect(respond).toBeDefined());
    engine.dispose();
    expect(signal?.aborted).toBe(true);
    respond?.(new Response(new ArrayBuffer(8)));
    await loading;
    await engine.pluck(note);
    expect(fake.Source.all).toHaveLength(0);
  });
});
