# Cloudflare deployment

The website is an Astro static build served by Workers Static Assets. Recordings
live in the existing R2 bucket at `audio.skylu.me`. The website has no Worker
script, SSR adapter, R2 binding, or deployment credentials in source.

## Deployment targets

`wrangler.jsonc` has two explicitly selected environments:

| Environment  | Worker                   | Address                                                                    |
| ------------ | ------------------------ | -------------------------------------------------------------------------- |
| `preview`    | `sky-lu-website-preview` | [workers.dev preview](https://sky-lu-website-preview.skylty01.workers.dev) |
| `production` | `sky-lu-website`         | `https://skylu.me`                                                         |

The preview is deployed. The production configuration is prepared but has not
been deployed or connected to the domain. Production publishing creates the
custom-domain route and Cloudflare-managed DNS/certificate; editing this file
or running a dry-run does not. The preview environment has no custom-domain route.

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
pnpm cf:dry-run:production
pnpm cf:preview
```

Both dry-run commands build and validate their named targets without publishing.
Preview commands explicitly select `--env preview`, even if a shell has
`CLOUDFLARE_ENV=production` set. `cf:preview`
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

## Production release

Before the first publication, review and rebase-merge the intended commits into
`main`, finish the agreed launch checks, and authorize connecting `skylu.me`.
Do not attach the production domain to the preview Worker.

For a local release, switch the existing checkout to the reviewed, clean `main`
and run `pnpm cf:deploy:production`. The command refuses feature branches,
uncommitted/untracked changes, and revisions that do not match the current
remote `main`. It runs `verify:full`, builds with the commit ID in the footer,
checks the revision again, publishes with `--env production`, then checks
`https://skylu.me`. The first publication can require time for the custom domain
and certificate to become active; rerun the read-only delivery check once active.
The R2 custom domain remains `audio.skylu.me`.

## GitHub releases

The existing CI workflow adds a production job after **Quality** and **Browser**
pass. It runs only for `main` pushes or manual CI runs on `main`, and only when the
repository variable `CLOUDFLARE_PRODUCTION_ENABLED` is `true`. Leave that variable
unset until the following settings are configured and launch is approved:

1. Protect `main`: require pull requests, the **Quality** and **Browser** checks,
   and linear history. Keep rebase merging enabled and do not allow force pushes.
2. Create a GitHub environment named `production`, restrict deployment branches
   to `main`, and require your approval. For a solo-maintained repository, allow
   the person starting a run to approve it. A workflow's environment name alone
   does not configure these protections.
3. In that environment, add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as
   secrets. Create the token through Cloudflare's **Edit Cloudflare Workers**
   template, scoped to this account and the `skylu.me` zone. It must support
   script/asset deployment and custom-domain management. Do not reuse or copy
   Wrangler's local OAuth token into GitHub; no R2 key is needed.
4. Enable the repository variable after approval. Either merge the next reviewed
   change or run CI manually on `main` to begin the first protected release.

CI checks out the exact tested revision, permits its detached checkout only when
the CI ref and commit identify `main`, and refuses an outdated commit if remote
`main` has advanced. Main runs are serialized so a new push cannot interrupt an
upload. Superseded runs can fail the revision guard; let the newer run publish.
Credentials are passed only to the publish step. This workflow has not yet been
pushed, executed on GitHub, or supplied with deployment secrets.

The repository inspection for this setup found no effective `main` protection
rules and no `production` environment. Configure them before enabling releases.

## Recovery

For an existing preview, **Workers & Pages → sky-lu-website-preview → Deployments**
shows its versions. To undo a bad preview, use Cloudflare's rollback control for
a known-good deployment; a first deployment has no earlier version to restore.
Do not roll back, delete a Worker, or alter production without explicit approval.

For production recovery, select a known-good version under the production
Worker's Deployments page after approval. If a post-deploy check fails, deployment
may already have succeeded; inspect the version and domain status before retrying
or rolling back. A rollback changes served code, not Git history or R2 objects.

References: [Astro static hosting](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/),
[static asset headers](https://developers.cloudflare.com/workers/static-assets/headers/),
[custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).
