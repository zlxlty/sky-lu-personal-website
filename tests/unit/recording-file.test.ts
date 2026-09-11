import { describe, expect, it } from "vitest";
import {
  assertFastStart,
  assertUnreferenced,
  recordingKey,
} from "../../scripts/lib/recording-file";

function atom(type: string, payload = "") {
  const bytes = Buffer.alloc(8 + payload.length);
  bytes.writeUInt32BE(bytes.length);
  bytes.write(type, 4);
  bytes.write(payload, 8);
  return bytes;
}

describe("recording delivery safeguards", () => {
  it("accepts metadata before media, including a partial media payload", () => {
    const media = atom("mdat", "long audio payload");
    expect(() =>
      assertFastStart(
        Buffer.concat([atom("ftyp"), atom("moov"), media.subarray(0, 8)]),
      ),
    ).not.toThrow();
    expect(() => assertFastStart(Buffer.concat([media, atom("moov")]))).toThrow(
      "metadata must precede",
    );
    expect(() => assertFastStart(Buffer.from("bad file"))).toThrow();
    expect(() => assertFastStart(atom("moov").subarray(0, 7))).toThrow();
  });

  it("versions changed bytes and rejects path traversal names", () => {
    expect(recordingKey("my-cover", Buffer.from("a"))).toMatch(
      /^recordings\/my-cover\.[a-f0-9]{16}\.m4a$/,
    );
    expect(recordingKey("my-cover", Buffer.from("a"))).not.toBe(
      recordingKey("my-cover", Buffer.from("b")),
    );
    expect(() => recordingKey("../cover", Buffer.alloc(0))).toThrow();
  });

  it("refuses deletion when any local or served playlist still references the file", () => {
    const key = "recordings/cover.1234567890abcdef.m4a";
    expect(() => assertUnreferenced(key, [key], [])).toThrow("local playlist");
    expect(() =>
      assertUnreferenced(
        key,
        [],
        [`<audio src="https://audio.skylu.me/${key}">`],
      ),
    ).toThrow("production or preview");
    expect(() => assertUnreferenced("../cover.m4a", [], [])).toThrow();
    expect(() =>
      assertUnreferenced(key, [], ["another recording"]),
    ).not.toThrow();
  });
});
