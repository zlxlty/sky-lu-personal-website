import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import recordings from "../src/data/recordings.json" with { type: "json" };
import {
  assertFastStart,
  assertUnreferenced,
  recordingKey,
} from "./lib/recording-file.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const [command, input, slug, ...extra] = process.argv.slice(2);
const directory = resolve(root, ".recordings");
const cacheControl = "public, max-age=31536000, immutable";
const wrangler = (...args: string[]) =>
  execFileSync("pnpm", ["exec", "wrangler", ...args], {
    cwd: root,
    stdio: "inherit",
  });

function audioHash(path: string) {
  return execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      path,
      "-map",
      "0:a:0",
      "-c:a",
      "copy",
      "-f",
      "hash",
      "-hash",
      "sha256",
      "-",
    ],
    { encoding: "utf8" },
  ).trim();
}

async function request(url: string, range?: string) {
  const response = await fetch(url, {
    headers: range ? { Range: range } : {},
    signal: AbortSignal.timeout(30_000),
  });
  assert(response.ok, `${url}: HTTP ${response.status}`);
  return response;
}

if (command === "prepare") {
  assert(
    input && slug && extra.length === 0,
    "Usage: pnpm recordings prepare <local-file> <name>",
  );
  recordingKey(slug, Buffer.alloc(0)); // Validate the name before using it as a path.
  await mkdir(directory, { recursive: true });
  const temporary = resolve(directory, `${slug}.preparing.m4a`);
  try {
    execFileSync(
      "ffmpeg",
      [
        "-v",
        "error",
        "-y",
        "-i",
        resolve(input),
        "-map",
        "0:a:0",
        "-c:a",
        "copy",
        "-map_metadata",
        "-1",
        "-movflags",
        "+faststart",
        temporary,
      ],
      { stdio: "inherit" },
    );
    assert.equal(
      audioHash(resolve(input)),
      audioHash(temporary),
      "Remux changed encoded audio packets",
    );
    const bytes = await readFile(temporary);
    assertFastStart(bytes);
    const key = recordingKey(slug, bytes);
    const output = resolve(directory, basename(key));
    await writeFile(output, bytes);
    console.log(
      `Prepared ${output}\nObject: ${key}\n${bytes.length} bytes; audio packets unchanged.\nNext: pnpm recordings upload ${output}`,
    );
  } finally {
    await rm(temporary, { force: true });
  }
} else if (command === "upload") {
  assert(input && !slug, "Usage: pnpm recordings upload <prepared-file>");
  const bytes = await readFile(resolve(input));
  assertFastStart(bytes);
  const name = basename(input).match(/^([a-z0-9-]+)\.[a-f0-9]{16}\.m4a$/)?.[1];
  assert(name, "Upload a hashed file produced by prepare");
  const key = recordingKey(name, bytes);
  assert.equal(
    basename(input),
    basename(key),
    "File hash does not match its name; run prepare again",
  );
  wrangler(
    "r2",
    "object",
    "put",
    `${recordings.bucket}/${key}`,
    "--remote",
    "--file",
    resolve(input),
    "--content-type",
    "audio/mp4",
    "--cache-control",
    cacheControl,
  );
  const response = await request(`${recordings.origin}/${key}`);
  assert.deepEqual(
    Buffer.from(await response.arrayBuffer()),
    bytes,
    "Public object differs from uploaded file",
  );
  console.log(
    `Verified ${recordings.origin}/${key}\nAdd this key to src/data/recordings.json, then deploy the site. Existing objects are unchanged.`,
  );
} else if (command === "remove") {
  assert(
    input && (!slug || slug === "--execute") && extra.length === 0,
    "Usage: pnpm recordings remove <object-key> [--execute]",
  );
  const html = [];
  for (const origin of [
    "https://skylu.me",
    "https://sky-lu-website-preview.skylty01.workers.dev",
  ]) {
    const response = await request(`${origin}/`);
    const text = await response.text();
    assert(
      text.includes("local-record"),
      `Cannot verify the playlist at ${origin}`,
    );
    html.push(text);
  }
  assertUnreferenced(input, Object.values(recordings.files), html);
  if (slug === "--execute")
    wrangler(
      "r2",
      "object",
      "delete",
      `${recordings.bucket}/${input}`,
      "--remote",
    );
  else
    console.log(
      `Dry run: would delete ${recordings.bucket}/${input}. Keep objects needed by old pages or rollbacks. Pass --execute to delete.`,
    );
} else if (command === "check") {
  assert(!input, "Usage: pnpm recordings check");
  for (const key of Object.values(recordings.files)) {
    const url = `${recordings.origin}/${key}`;
    const response = await request(url, "bytes=0-262143");
    assert.equal(response.status, 206, `${key}: range requests unavailable`);
    assert.match(response.headers.get("content-type") ?? "", /^audio\/mp4/);
    assert.equal(response.headers.get("cache-control"), cacheControl);
    assertFastStart(Buffer.from(await response.arrayBuffer()));
    const warm = await request(url, "bytes=0-31");
    assert.equal(warm.status, 206);
    assert.equal((await warm.arrayBuffer()).byteLength, 32);
    console.log(
      `${key}: fast start, ranges, immutable cache headers; edge ${warm.headers.get("cf-cache-status") ?? "unknown"}`,
    );
    assert.equal(
      warm.headers.get("cf-cache-status"),
      "HIT",
      "Edge cache not warm/eligible; check the audio Cache Rule, then retry",
    );
  }
} else {
  console.log(
    "Recording management (Wrangler login; prepare also needs ffmpeg):\n  pnpm recordings prepare <local-file> <name>\n  pnpm recordings upload <prepared-file>\n  pnpm recordings check\n  pnpm recordings remove <object-key> [--execute]\nUploads are remote and versioned. Removal defaults to a dry run and refuses referenced files.",
  );
  if (command && command !== "--help") process.exitCode = 1;
}
