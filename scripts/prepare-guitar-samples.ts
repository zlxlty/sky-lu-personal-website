/** Explicit, development-only sample preparation. Requires ffmpeg and tar. */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import quartertoneSources from "./guitar-sources/quartertone.json" with { type: "json" };

const output = resolve("src/lab/assets/guitar");
const selectedOutput = resolve("src/assets/guitar");
const assetPath = (file: string) =>
  resolve(file.startsWith("quartertone/") ? selectedOutput : output, file);
const cache = resolve("node_modules/.cache/guitar-sources");
const shinyRevision = "57243cca85277dbcc120ce17c6178032f93c80f3";
const shinyBase = `https://raw.githubusercontent.com/sfzinstruments/karoryfer.shinyguitar/${shinyRevision}`;
const fssSource =
  "https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-SFZ-20200521.tar.xz";
const archiveRoot = "FSS-SteelStringGuitar-SFZ-20200521";
const notes = [64, 59, 55, 50, 45, 40]; // Screen order: high E to low E.

async function download(url: string, file: string) {
  if (existsSync(file)) return;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Download failed (${response.status}): ${url}`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
}

async function encodeMono(input: string, file: string, filters?: string) {
  await mkdir(dirname(assetPath(file)), { recursive: true });
  execFileSync("ffmpeg", [
    "-v",
    "error",
    "-y",
    "-i",
    input,
    "-map_metadata",
    "-1",
    ...(filters ? ["-af", filters] : []),
    "-ac",
    "1",
    "-ar",
    "44100",
    "-codec:a",
    "libmp3lame",
    "-q:a",
    "3",
    assetPath(file),
  ]);
}

// Equal MIDI bands for libraries that name dynamics without publishing splits.
function velocityBand(layer: number, count: number) {
  return {
    low: Math.floor(((layer - 1) * 128) / count) / 127,
    high: (Math.floor((layer * 128) / count) - 1) / 127,
  };
}

function analyze(file: string) {
  const bytes = execFileSync(
    "ffmpeg",
    [
      "-v",
      "error",
      "-i",
      file,
      "-ac",
      "1",
      "-ar",
      "44100",
      "-f",
      "f32le",
      "pipe:1",
    ],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  const frames = bytes.length / 4;
  let peak = 0;
  for (let i = 0; i < frames; i++)
    peak = Math.max(peak, Math.abs(bytes.readFloatLE(i * 4)));
  let onset = 0;
  while (onset < frames && Math.abs(bytes.readFloatLE(onset * 4)) < peak * 0.01)
    onset++;
  // Keep two milliseconds before the attack; skip only leading recording silence.
  const start = Math.max(0, onset - 88);
  const end = Math.min(frames, start + 66150);
  let energy = 0;
  for (let i = start; i < end; i++) energy += bytes.readFloatLE(i * 4) ** 2;
  if (!energy) throw new Error(`Silent sample: ${file}`);
  return { offset: start / 44100, meanSquare: energy / (end - start) };
}

interface Sample {
  file: string;
  stringIndex: number;
  midi: number;
  rootMidi: number;
  low: number;
  high: number;
  take: number;
  offset: number;
  meanSquare: number;
}

await mkdir(output, { recursive: true });
await mkdir(cache, { recursive: true });
const shiny: Sample[] = [];
const roots = [
  { name: "eb4", midi: 63 },
  { name: "c4", midi: 60 },
  { name: "gb3", midi: 54 },
  { name: "eb3", midi: 51 },
  { name: "a2", midi: 45 },
  { name: "e2", midi: 40 },
];
for (const [stringIndex, root] of roots.entries()) {
  for (let layer = 1; layer <= 4; layer++) {
    for (let take = 1; take <= 2; take++) {
      const original = `${root.name}_vl${layer}_rr${take}_1.wav`;
      const input = resolve(cache, "shiny", original);
      const file = `shiny/${original.replace(".wav", ".mp3")}`;
      await download(`${shinyBase}/Samples/acoustic/${original}`, input);
      await encodeMono(input, file);
      shiny.push({
        file,
        stringIndex,
        midi: notes[stringIndex] ?? 0,
        rootMidi: root.midi,
        low: layer === 1 ? 0 : ((layer - 1) * 32 + 1) / 127,
        high: Math.min(127, layer * 32) / 127,
        take,
        ...analyze(assetPath(file)),
      });
    }
  }
  console.log(`Prepared archtop string ${stringIndex + 1}/6`);
}
await download(`${shinyBase}/LICENSE`, resolve(output, "SHINYGUITAR-CC0.txt"));

const archive = resolve(cache, "fss.tar.xz");
await download(fssSource, archive);
const unpack = (file: string) =>
  execFileSync("tar", ["-xOf", archive, `${archiveRoot}/${file}`], {
    maxBuffer: 16 * 1024 * 1024,
  });
const sfz = unpack("FSS-SteelStringGuitar-20200521.sfz").toString();
const fss: Sample[] = [];
for (const region of sfz.split("<region>").slice(1)) {
  const number = (key: string, fallback: number) =>
    Number(new RegExp(`\\b${key}=(\\d+)`).exec(region)?.[1] ?? fallback);
  const key = number("key", -1);
  const lowKey = number("lokey", key);
  const highKey = number("hikey", key);
  const rootMidi = number("pitch_keycenter", key);
  const original = /sample=(samples\/[A-Z]+_\d+\.wav)/.exec(region)?.[1];
  if (!original) throw new Error("Unrecognized FSS sample path");
  for (const [stringIndex, midi] of notes.entries()) {
    if (midi < lowKey || midi > highKey) continue;
    const file = `fss/${original.slice("samples/".length)}`;
    await mkdir(dirname(resolve(output, file)), { recursive: true });
    // Keep the selected GPL sample files byte-for-byte, as their own source.
    await writeFile(resolve(output, file), unpack(original));
    fss.push({
      file,
      stringIndex,
      midi,
      rootMidi,
      low: number("lovel", 0) / 127,
      high: number("hivel", 127) / 127,
      take: 1,
      ...analyze(resolve(output, file)),
    });
  }
}
await writeFile(resolve(output, "FSS-GPL.txt"), unpack("gpl.txt"));
await writeFile(resolve(output, "FSS-NOTICE.txt"), unpack("readme.txt"));

const quartertone: Sample[] = [];
for (const source of quartertoneSources.samples) {
  // Omit the harshest fifth layer; spread the remaining four over all velocities.
  if (source.velocityLayer === 5) continue;
  const input = resolve(cache, source.cacheFile);
  await download(source.previewUrl, input);
  const hash = createHash("sha256")
    .update(await readFile(input))
    .digest("hex");
  if (hash !== source.previewSha256)
    throw new Error(
      `Quartertone preview changed: ${source.soundId}; review its source before regenerating.`,
    );
  const file = `quartertone/${source.soundId}.mp3`;
  const end = source.previewDurationSeconds;
  // Preview MP3s have no verified sampler loop headers. Use finite one-shots
  // and fade their authored loop tails instead of looping approximate points.
  await encodeMono(
    input,
    file,
    `atrim=end=${end},afade=t=out:st=${end - 0.3}:d=0.3`,
  );
  quartertone.push({
    file,
    stringIndex: source.stringIndex,
    midi: source.midi,
    rootMidi: source.rootMidi,
    take: 1,
    ...velocityBand(source.velocityLayer, 4),
    ...analyze(assetPath(file)),
  });
}
await download(
  "https://creativecommons.org/licenses/by/4.0/legalcode.txt",
  resolve(selectedOutput, "QUARTERTONE-CC-BY-4.0.txt"),
);
console.log(`Prepared ${quartertone.length} Quartertone classical samples`);

const iowaBase =
  "https://theremin.music.uiowa.edu/sound%20files/MIS/Piano_Other/guitar/";
// Reviewed ends of the FIRST/open note in each chromatic scale, in seconds.
// Preserve its decay and stop before the next pitch; order is pp, mf, ff.
const iowaStrings = [
  { name: "sul_E.E4B4", ends: [4.5, 6.9, 6.2] },
  { name: "sulB.B3", ends: [6.4, 11.7, 8.7] },
  { name: "sulG.G3B3", ends: [8, 10.7, 8.7] },
  { name: "sulD.D3B3", ends: [14.5, 16.9, 18.8] },
  { name: "sulA.A2B2", ends: [12, 11.6, 15.7] },
  { name: "sulE.E2B2", ends: [11.3, 10.3, 18.4] },
];
const iowa: Sample[] = [];
const iowaSources = [];
for (const [stringIndex, string] of iowaStrings.entries()) {
  const midi = notes[stringIndex];
  if (midi === undefined) throw new Error("Missing Iowa target pitch");
  for (const [index, dynamic] of ["pp", "mf", "ff"].entries()) {
    const original = `Guitar.${dynamic}.${string.name}.mono.aif`;
    const input = resolve(cache, "iowa", original);
    const url = `${iowaBase}${original}`;
    await download(url, input);
    const end = string.ends[index];
    if (end === undefined)
      throw new Error(`Missing Iowa note boundary: ${original}`);
    const file = `iowa/${midi}-${dynamic}.mp3`;
    // The raw recordings contain subsonic rumble. Remove only the region below
    // the lowest guitar fundamental (E2 ≈ 82 Hz), then trim/fade the note's tail.
    await encodeMono(
      input,
      file,
      `highpass=f=30,atrim=end=${end},afade=t=out:st=${end - 0.15}:d=0.15`,
    );
    iowa.push({
      file,
      stringIndex,
      midi,
      rootMidi: midi,
      take: 1,
      ...velocityBand(index + 1, 3),
      ...analyze(assetPath(file)),
    });
    iowaSources.push({
      file,
      url,
      end,
      sha256: createHash("sha256")
        .update(await readFile(input))
        .digest("hex"),
    });
  }
  console.log(`Prepared Iowa string ${stringIndex + 1}/6`);
}

function bank(id: string, samples: Sample[], referenceVelocity = 76) {
  // One trim for the whole bank preserves relative note and layer dynamics.
  // Compare the average first 1.5 seconds of the six notes at MIDI velocity 76.
  const reference = samples.filter(
    (s) =>
      s.low <= referenceVelocity / 127 && s.high >= referenceVelocity / 127,
  );
  if (new Set(reference.map((s) => s.stringIndex)).size !== 6)
    throw new Error(`Incomplete bank: ${id}`);
  const energy =
    reference.reduce((sum, s) => sum + s.meanSquare, 0) / reference.length;
  const gain = 0.055 / Math.sqrt(energy);
  return { id, gain, samples };
}
await writeFile(
  resolve(output, "manifest.json"),
  JSON.stringify(
    {
      preparation:
        "Whole-bank RMS trim; mean of six medium plucks, first 1.5s after onset. No EQ or reverb.",
      shinyRevision,
      fssSource,
      fssSha256: createHash("sha256")
        .update(await readFile(archive))
        .digest("hex"),
      quartertoneSource: quartertoneSources.sourceUrl,
      iowaSources,
      banks: [bank("shiny", shiny), bank("fss", fss), bank("iowa", iowa)],
    },
    null,
    2,
  ) + "\n",
);
await writeFile(
  resolve(selectedOutput, "quartertone.json"),
  // Keep the previously reviewed gain trim (recorded layer four). Removing the
  // loudest layer must not normalize the remaining recordings back up in volume.
  JSON.stringify(bank("quartertone", quartertone, 100), null, 2) + "\n",
);
console.log(
  `Prepared ${shiny.length + fss.length + quartertone.length + iowa.length} samples across four guitars.`,
);
