# Sky Lu's Personal Website

Sky Lu's personal website and technical blog, built as a static-first Astro site
with narrowly scoped React islands. The repository now includes its design system,
responsive blueprint shell, persistent themes, curated controls, and development
component lab. Typed content and the core public routes are the next stage.

The production architecture is static by default: Astro renders pages and MDX at
build time, while React is reserved for behavior that needs a browser runtime. The
planned interactive guitar is the homepage's primary client island. Cloudflare
Workers Static Assets is the production target; SSR and backend storage are not
part of v1.

See [DEVELOPMENT.md](./DEVELOPMENT.md) for developer-tool usage and Playwright CI
failure diagnostics. Product and architecture decisions live in [PLAN.md](./PLAN.md),
and the staged delivery roadmap lives in [IMPLEMENTATIONS.md](./IMPLEMENTATIONS.md).

## Prerequisites

- Git.
- A Node.js version manager such as `nvm`.
- Corepack, which activates the pnpm version pinned by `package.json`.

## Getting started

Clone the repository and enter it:

```bash
git clone https://github.com/zlxlty/sky-lu-personal-website.git
cd sky-lu-personal-website
```

Install and activate the pinned Node.js and pnpm versions, install dependencies,
and install the configured Playwright browser:

```bash
nvm install
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
cp .env.example .env.local
```

`pnpm install` runs the repository's `prepare` script and installs the local
pre-commit hook automatically. No additional hook command is normally required.
If the hook is missing from an existing checkout, reinstall it with:

```bash
pnpm run prepare
```

Do not run `pnpm approve-builds simple-git-hooks`. The dependency's own postinstall
is intentionally blocked; the trusted repository-level `prepare` script installs
the hook instead.

Start the Astro development server:

```bash
pnpm dev
```

Open the local URL printed by Astro. Visit `/` for the site and `/lab` for the
development-only component workshop. No environment variables are required during
the current routes or component-lab workflow.

Before proposing a change, run the local CI-equivalent checks:

```bash
pnpm verify
pnpm verify:full
```

`pnpm verify:full` includes the production-style Playwright browser test and is the
right final check for browser-facing changes.

## Commands

| Command             | Purpose                                                |
| ------------------- | ------------------------------------------------------ |
| `pnpm dev`          | Start Astro with hot module replacement.               |
| `pnpm build`        | Generate the production site in `dist/`.               |
| `pnpm preview`      | Serve the production build locally.                    |
| `pnpm check`        | Run Astro, TypeScript, and content type checks.        |
| `pnpm format:check` | Check formatting without writing files.                |
| `pnpm lint`         | Run ESLint without writing files.                      |
| `pnpm test`         | Run unit tests once.                                   |
| `pnpm test:e2e`     | Run Playwright against a production-style server.      |
| `pnpm test:lab`     | Test `/lab` and compare local visual snapshots.        |
| `pnpm test:lab:ui`  | Open Playwright UI for component-lab debugging.        |
| `pnpm verify`       | Run formatting, linting, types, unit tests, and build. |
| `pnpm verify:full`  | Run `verify` plus browser tests.                       |

See [DEVELOPMENT.md](./DEVELOPMENT.md) for every command, test selection,
debugging, CI behavior, editor setup, and Git workflow. `pnpm cf:preview` is
reserved for the Cloudflare deployment stage and is not available yet.
