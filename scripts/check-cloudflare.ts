import assert from "node:assert/strict";

// Read-only checks against Wrangler locally or the deployed static asset host.
const origin = new URL(process.argv[2] ?? "http://127.0.0.1:8787");
assert(
  ["http:", "https:"].includes(origin.protocol),
  "Expected an HTTP(S) URL.",
);
assert(
  !origin.username && !origin.password,
  "Do not pass credentials in the URL.",
);
const isPreview = origin.hostname.endsWith(".workers.dev");
const audioFiles = ["seaway.m4a", "likeastar.m4a", "starrysky.m4a"];
const rawEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

async function request(path: string) {
  return fetch(new URL(path, origin), {
    redirect: "manual",
    signal: AbortSignal.timeout(20_000),
  });
}

let homepage = "";
for (const path of [
  "/",
  "/writing",
  "/projects",
  "/projects/tundra",
  "/privacy",
]) {
  const response = await request(path);
  assert.equal(
    response.status,
    200,
    `${path}: expected a direct page response`,
  );
  assert.match(response.headers.get("content-type") ?? "", /text\/html/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    response.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin",
  );
  assert.equal(
    response.headers.get("cross-origin-opener-policy"),
    "same-origin",
  );
  if (isPreview) assert.equal(response.headers.get("x-robots-tag"), "noindex");
  const html = await response.text();
  assert(!rawEmail.test(html), `${path}: raw email found in served HTML`);
  assert(
    html.includes(`rel="canonical" href="https://skylu.me${path}"`),
    `${path}: canonical URL missing`,
  );
  for (const file of audioFiles) {
    assert(
      html.includes(`https://audio.skylu.me/${file}`),
      `${path}: recording URL missing`,
    );
    assert(
      !html.includes(`https://skylu.me/${file}`),
      `${path}: retired recording URL found`,
    );
  }
  if (path === "/") homepage = html;
  console.log(
    `PASS ${path}: HTML, canonical URL, headers, audio URLs, email scan`,
  );
}

for (const path of [
  "/missing-page",
  "/missing-page/",
  "/cv",
  "/cv/",
  "/cv.pdf",
  "/lab",
  "/lab/guitar",
  "/_headers",
  ...audioFiles.map((file) => `/${file}`),
]) {
  const response = await request(path);
  assert.equal(
    response.status,
    404,
    `${path}: expected 404 without a redirect`,
  );
  const html = await response.text();
  assert(html.includes("Page not found"), `${path}: custom 404 missing`);
  assert(!rawEmail.test(html), `${path}: raw email found in 404 HTML`);
  console.log(`PASS ${path}: custom 404`);
}

for (const path of ["/writing/", "/projects/", "/projects/tundra/"]) {
  const response = await request(path);
  assert(
    [301, 307, 308].includes(response.status),
    `${path}: expected canonical redirect`,
  );
  const location = response.headers.get("location");
  assert(location, `${path}: redirect destination missing`);
  assert.equal(new URL(location, origin).pathname, path.slice(0, -1));
  console.log(`PASS ${path}: trailing slash removed`);
}

const assetPaths = [
  ...new Set(homepage.match(/\/_astro\/[^"\s<>]+\.(?:css|js)/g)),
];
assert(assetPaths.length > 0, "Expected fingerprinted CSS or JS assets.");
for (const path of assetPaths) {
  const response = await request(path);
  assert.equal(response.status, 200, `${path}: asset unavailable`);
  assert.match(response.headers.get("cache-control") ?? "", /immutable/);
  assert.match(
    response.headers.get("content-type") ?? "",
    path.endsWith(".css") ? /text\/css/ : /javascript/,
  );
  await response.body?.cancel();
}
console.log(
  `PASS ${assetPaths.length} fingerprinted assets: MIME types and immutable caching`,
);

for (const file of audioFiles) {
  const response = await fetch(`https://audio.skylu.me/${file}`, {
    headers: { Range: "bytes=0-31" },
    signal: AbortSignal.timeout(20_000),
  });
  assert.equal(
    response.status,
    206,
    `${file}: byte-range playback unavailable`,
  );
  assert.match(response.headers.get("content-type") ?? "", /audio\//);
  assert.match(
    response.headers.get("content-range") ?? "",
    /^bytes 0-31\/\d+$/,
  );
  assert.equal((await response.arrayBuffer()).byteLength, 32);
  console.log(`PASS ${file}: public audio and byte-range delivery`);
}

console.log(`Cloudflare checks passed for ${origin.origin}`);
