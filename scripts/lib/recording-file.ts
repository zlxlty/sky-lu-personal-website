import assert from "node:assert/strict";
import { createHash } from "node:crypto";

/** Walk MP4 top-level atoms; media payloads need not fit in this prefix. */
export function assertFastStart(bytes: Buffer) {
  let metadata = false;
  for (let offset = 0; offset + 8 <= bytes.length;) {
    let size = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    if (size === 1) {
      assert(offset + 16 <= bytes.length, "Truncated extended atom");
      size = Number(bytes.readBigUInt64BE(offset + 8));
    }
    if (type === "mdat") {
      assert(metadata, "Recording metadata must precede audio (run prepare)");
      return;
    }
    assert(Number.isSafeInteger(size) && size >= 8, "Invalid MP4 atom size");
    assert(
      offset + size <= bytes.length,
      "Metadata exceeds the available prefix",
    );
    if (type === "moov") metadata = true;
    offset += size;
  }
  throw new Error("No MP4 media atom found");
}

export function recordingKey(slug: string, bytes: Buffer) {
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug),
    "Use a lowercase hyphenated recording name",
  );
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return `recordings/${slug}.${hash}.m4a`;
}

export function assertUnreferenced(
  key: string,
  localKeys: string[],
  servedHtml: string[],
) {
  assert(
    /^(?:recordings\/)?[a-z0-9.-]+\.m4a$/.test(key) && !key.includes(".."),
    "Expected an M4A object key",
  );
  assert(
    !localKeys.includes(key),
    "Refusing to remove a recording referenced by the local playlist",
  );
  assert(
    !servedHtml.some((html) => html.includes(key)),
    "Refusing to remove a recording referenced by production or preview",
  );
}
