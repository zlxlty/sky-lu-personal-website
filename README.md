# Sky Lu's Personal Website

Sky Lu's personal website and technical blog, built as a static-first Astro site
with narrowly scoped React islands. The project is currently in its foundation
stage.

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

Open the local URL printed by Astro. No environment variables are required during
the current foundation stage.

Before proposing a change, run the local CI-equivalent checks:

```bash
pnpm verify
pnpm verify:full
```

`pnpm verify:full` includes the production-style Playwright browser test and is the
right final check for browser-facing changes.
