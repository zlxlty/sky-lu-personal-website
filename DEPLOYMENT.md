# Cloudflare deployment

The website is an Astro static build served by Workers Static Assets. Recordings
live in the existing R2 bucket at `audio.skylu.me`. The website has no Worker
script, SSR adapter, R2 binding, or deployment credentials in source.

## Current target

`wrangler.jsonc` deploys **sky-lu-website-preview** to its account's `workers.dev`
address. It declares no custom domain or route. This is a public preview of the
current feature branch; production at `skylu.me` and automatic GitHub deployments
remain separate release steps.

Astro's site URL is `https://skylu.me`. Public pages advertise that canonical
origin even on the preview. Workers preview responses carry `X-Robots-Tag:
noindex`; this discourages indexing but does not make the preview private.

Use the Node and pnpm versions pinned in `.nvmrc` and `package.json`. Wrangler is
a pinned development dependency; it adds no browser bundle or server runtime to
the deployed site. Its `workerd` binary is used only for local Cloudflare preview.
The package build allowlist permits that binary's installation check.

## Local checks

```sh
pnpm install --frozen-lockfile
pnpm verify
pnpm cf:dry-run
pnpm cf:preview
```

`cf:dry-run` builds and validates the upload without publishing. `cf:preview`
builds and serves through local Wrangler at `http://127.0.0.1:8787`; it does not
deploy. From a second terminal, run:

```sh
pnpm cf:check
```

This read-only check verifies direct routes, canonical URLs, security and cache
headers, generated assets, custom 404s, absent lab/CV routes, and the new audio
URLs. It also checks that all three recordings support byte-range requests and
that served HTML contains no raw email address. An Internet connection is needed
for the small audio range checks.

## Authentication and preview deployment

Authenticate on your own machine:

```sh
pnpm exec wrangler login
```

Complete Cloudflare's browser authorization. Wrangler stores OAuth credentials
outside this repository. Do not copy tokens or credentials into source or chat.
No R2 access key is needed: the browser plays public files from the audio domain.

After reviewing the build and authorizing a preview publication:

```sh
pnpm cf:deploy:preview
```

**This command publishes the current working tree** to the preview Worker. It
builds before uploading, then prints the live URL. It does not commit, push,
merge, change DNS, or publish to `skylu.me`. If Wrangler lists multiple accounts,
select the account containing your domain and R2 bucket.

Run `pnpm cf:check` with the printed HTTPS URL as its argument to repeat the
checks against Cloudflare. In a browser, also check the homepage at desktop and
mobile widths, both themes, explicit guitar unmute, and footer playback and
record switching. `/lab` is deliberately absent from deployed builds.

## Routing, audio, and headers

- Public page URLs have no trailing slash, except `/`. Astro and Wrangler use
  the same policy; missing paths serve `404.html` with status 404.
- Edit `src/data/listening.ts` to add recordings and their metadata. Use
  `https://audio.skylu.me/<file>`; the three previous root-domain audio paths
  intentionally return 404. There are no legacy redirects.
- `public/_headers` sets content-type, referrer, frame, opener, and unused-device
  policies. Fingerprinted `/_astro/` assets use immutable browser caching;
  other assets retain Cloudflare's revalidation defaults. The preview noindex
  rule matches only `workers.dev` hosts.
- Full CSP and the final robots, sitemap, feed, and bot policy remain launch
  follow-ups. This preview does not render email contact links or add analytics.

## Production and recovery

Before production, review and merge the intended commits into `main`, finish
the remaining launch checks, and add a separately reviewed production target.
The current configuration cannot attach a hostname or deploy a production Worker.

After a production Worker is ready, add `skylu.me` in **Workers & Pages → Worker
→ Settings → Domains & Routes → Add → Custom Domain**. The R2 custom domain stays
`audio.skylu.me`. Cloudflare manages the website's DNS record and certificate.

For an existing preview, **Workers & Pages → sky-lu-website-preview → Deployments**
shows its versions. To undo a bad preview, use Cloudflare's rollback control for
a known-good deployment; a first deployment has no earlier version to restore.
Do not roll back, delete a Worker, or alter production without explicit approval.

GitHub CI deployment and credentials are not configured yet. A later workflow
will deploy reviewed `main` commits using scoped Cloudflare credentials stored in
GitHub secrets, with a protected production environment.

References: [Astro static hosting](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/),
[static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/),
[custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
