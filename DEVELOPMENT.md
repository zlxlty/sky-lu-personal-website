# Development

This is the complete local development guide for the current foundation. Keep it
in sync whenever a command, environment variable, test layer, or contributor
workflow changes.

## Toolchain

The repository pins its toolchain instead of relying on whatever happens to be
installed globally:

- `.nvmrc` pins Node.js 24.19.0.
- `package.json#engines` accepts compatible Node.js 24 and pnpm 11 releases.
- `package.json#packageManager` pins pnpm 11.22.0.
- `pnpm-lock.yaml` makes dependency resolution reproducible.

Use pnpm for all dependency and script operations. Do not use npm, Yarn, or Bun to
change the dependency graph or lockfile.

## First-time setup

From a fresh clone:

```bash
nvm install
nvm use
corepack enable
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
cp .env.example .env.local
pnpm dev
```

If `nvm` is unavailable, use another version manager to install the exact version
in `.nvmrc`. `pnpm install --frozen-lockfile` also runs the root `prepare` script,
which installs the local pre-commit hook.

Astro prints the local URL when the server is ready. Visit `/` for the site and
`/lab` for the development-only component workshop. Astro injects the lab only for
the development command, so production builds and previews do not expose it.

## Environment variables

No environment variable is required yet. Copying `.env.example` reserves an
ignored `.env.local` for later local-only values without changing current behavior.

Stage 09 introduces these build-time contact variables:

- `SITE_EMAIL_BROWN`
- `SITE_EMAIL_PERSONAL`

Leave both empty until that feature exists. Never commit their real values, add a
`PUBLIC_` prefix, print them, or include them in fixtures, snapshots, metadata, RSS,
or generated JSON. GitHub and Cloudflare receive production values through secrets,
not repository files.

## Architecture boundaries

- `src/pages/` defines routes. Astro statically generates them into `dist/`.
- `.astro` components own static content and route composition by default.
- `src/components/blueprint/` preserves the attributed React module seam migrated
  from `ncdai/chanhdai.com`; Astro renders these modules statically without a
  `client:*` directive.
- `Panel` is a boundary-owning divided stack: normal direct children are
  sections, `PanelHeader` owns the compact title row, and a sibling
  `PanelRuleBand` may follow it or separate later sections. The module
  reconciles shared edges; do not coordinate adjoining rules with call-site
  edge overrides.
- React components become client islands only when an explicit `client:*` directive
  is necessary.
- `src/components/ui/` contains the curated shadcn-compatible React primitives.
  Static uses render through Astro without hydration; interactive features should
  compose the primitives inside one feature-level island instead of adding a
  `client:*` directive to each control.
- Markdown and MDX content will live in Astro content collections rather than a
  database or CMS.
- Browser APIs, Tone.js, and per-frame guitar state remain behind client boundaries.
- Tailwind CSS and custom properties provide styling without requiring a client
  runtime.
- `tests/unit/` holds deterministic Vitest tests; `tests/e2e/` holds real-browser
  Playwright tests.

Do not introduce SSR, a Worker binding, or a hydrated React wrapper for static
content as a convenience. Cloudflare Workers Static Assets remains the production
target.

### Optional design-reference checkout

The production build does not depend on the upstream repository. For source
comparison, keep an optional checkout at `reference/chanhdai.com`; the entire
`reference/` directory is ignored by Git and excluded from formatting, linting,
type checking, and tests.

```bash
git clone https://github.com/ncdai/chanhdai.com reference/chanhdai.com
git -C reference/chanhdai.com checkout b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321
```

Port only general-purpose source through `src/components/blueprint/`, retain its
attribution, and update `THIRD_PARTY_NOTICES.md`. Do not copy upstream identity,
personal content, portraits, illustrations, or branded assets.

## Command reference

| Command                | Behavior                                                      |
| ---------------------- | ------------------------------------------------------------- |
| `pnpm dev`             | Start Astro's development server with hot module replacement. |
| `pnpm build`           | Generate the static production build in `dist/`.              |
| `pnpm preview`         | Serve the generated build through Astro for local inspection. |
| `pnpm check`           | Run `astro check`, TypeScript, and content type validation.   |
| `pnpm format`          | Write Prettier formatting across supported repository files.  |
| `pnpm format:check`    | Check formatting without writing.                             |
| `pnpm lint`            | Run ESLint without writing.                                   |
| `pnpm lint:fix`        | Apply safe ESLint fixes; inspect the diff afterward.          |
| `pnpm test`            | Run Vitest once in deterministic mode.                        |
| `pnpm test:watch`      | Keep Vitest running while unit-test code changes.             |
| `pnpm test:coverage`   | Run Vitest and write the ignored coverage report.             |
| `pnpm test:e2e`        | Build and run Playwright against a production-style server.   |
| `pnpm test:e2e:ui`     | Open Playwright UI mode for local browser-test debugging.     |
| `pnpm test:e2e:update` | Update reviewed browser snapshots when snapshots exist.       |
| `pnpm test:lab`        | Run `/lab` interaction, accessibility, and visual checks.     |
| `pnpm test:lab:ci`     | Run portable non-visual `/lab` checks used in CI.             |
| `pnpm test:lab:ui`     | Open Playwright UI against the development component lab.     |
| `pnpm test:lab:update` | Update reviewed macOS `/lab` visual snapshots.                |
| `pnpm verify`          | Run formatting, linting, type checks, unit tests, and build.  |
| `pnpm verify:full`     | Run `pnpm verify` followed by Playwright.                     |
| `pnpm run prepare`     | Reinstall the local pre-commit hook.                          |

`pnpm cf:preview` is intentionally unavailable until Stage 09 adds Wrangler. No
install, build, preview, verify, or Git hook command deploys the website.

## Normal development loop

1. Start from the latest reviewed `main` and create the planned `codex/...` feature
   branch.
2. Run `pnpm install --frozen-lockfile` when dependencies changed.
3. Run `pnpm dev` for browser feedback and `pnpm test:watch` for pure logic.
4. Compose static content in Astro, extend the migrated blueprint modules at their
   existing seam, and hydrate only the smallest required feature island. React UI
   primitives may be server-rendered without hydration when they are static.
5. Run the smallest relevant checks while working.
6. Before review, run `pnpm verify`; run `pnpm verify:full` for browser-facing work.
7. Inspect the complete diff, check privacy, and follow the approval process below.

## Editor setup

The repository includes optional VS Code recommendations for Astro, ESLint,
Prettier, Tailwind CSS, MDX, and Playwright. Install them from the workspace's
**Recommended Extensions** view. The settings use the repository's TypeScript and
formatter versions, but leave format-on-save disabled so opening the project cannot
rewrite a file unexpectedly.

Editor feedback is advisory. The `pnpm` commands remain authoritative and work in
any editor.

## Choose the right test

| Tool                   | Use it for                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Vitest                 | Geometry, scheduling, reducers, schemas, content filtering, and utilities.                                        |
| Playwright             | Routes, generated HTML, hydration, navigation, themes, pointer and keyboard behavior, and responsive integration. |
| Axe through Playwright | Automated accessibility regressions on representative pages.                                                      |
| Astro preview          | Generated routes, asset URLs, client chunks, and no-JavaScript behavior.                                          |
| Manual browser review  | Sound quality, animation feel, focus order, contrast, and assistive-technology judgment.                          |

Audio tests assert scheduling and instrument calls rather than attempting to record
speaker output. Automated Axe checks complement rather than replace keyboard and
screen-reader review.

Run a particular Vitest file during development by forwarding its path:

```bash
pnpm test:watch -- tests/unit/foundation.test.ts
```

Run a particular Playwright test or browser project with:

```bash
pnpm exec playwright test -g "homepage satisfies"
pnpm exec playwright test --project=chromium
```

### Component lab

The development-only `/lab` uses the real Astro layout, theme controller, Tailwind
configuration, and React island boundary. It replaces Storybook initially and
contains token, typography, rail-annotation, static-control, disclosure, tooltip,
overlay, and command-menu specimens. Rail annotations appear outside the content
rail at the `xl` breakpoint, so review them at 1280 px or wider. Astro's development
toolbar remains available during manual use; the lab's automated checks hide that
overlay so audits and screenshots measure only the application UI.

Start `pnpm dev` and visit `http://localhost:4321/lab`. Source changes update through
Vite. If a long-running server reports `504 Outdated Optimize Dep` after dependencies
change, rebuild its optimization cache once:

```bash
pnpm exec astro dev stop
pnpm exec astro dev --force
```

Use `pnpm test:lab` for the interaction, Axe, responsive, and reviewed visual targets.
Use `pnpm test:lab:ui` to step through them. Run `pnpm test:lab:update` only after
visually reviewing an intentional change; snapshot files are platform-specific.
Production Playwright independently verifies that the build contains no `/lab`
artifact. Astro's local Vite preview may rewrite an unknown path to `/`, while the
deployed Cloudflare 404 policy is verified in Stage 09.

### Production preview

Use a production preview for generated-output or hydration issues:

```bash
pnpm build
pnpm preview
```

Inspect `dist/`, loaded client chunks, browser console output, navigation, and the
no-JavaScript state. After Stage 09, use `pnpm cf:preview` specifically for
Cloudflare routing, bindings, and headers.

## Debugging

Start with Astro's development overlay and the browser console. For a problem that
appears only after building, reproduce it through `pnpm preview`. Use browser
developer tools to inspect layout shifts, long tasks, animation frames, network
requests, hydration warnings, and loaded chunks.

For unit tests, use `pnpm test:watch` and narrow the file or test name. For browser
tests, use `pnpm test:e2e:ui`, `--debug`, or the retained CI trace described below.

Vite provides source mapping during local development. Public production source-map
files are not enabled in the foundation. A later observability gate may generate
private CI source maps for upload without publishing ordinary `.map` files.

## Pre-commit checks

`pnpm install` runs the root `prepare` script, which installs a local Git pre-commit
hook through `simple-git-hooks`. The hook runs `lint-staged` against files already
staged for the proposed commit:

- Prettier checks supported source, content, configuration, and documentation.
- ESLint checks staged Astro, JavaScript, and TypeScript source.

Both tasks are check-only: they do not format, fix, or intentionally stage files.
If either task fails, the commit stops. Fix the reported file, run the relevant
repository command, review the new diff, and ask for commit approval again before
staging it.

Useful commands are:

```bash
pnpm format
pnpm lint:fix
pnpm format:check
pnpm lint
```

The first two commands write changes, so always inspect their diff. The latter two
only check. The hook is fast feedback, not a replacement for `pnpm verify`, CI, or
the repository's approval gate. Do not bypass it with `--no-verify` unless a
documented emergency has been explicitly approved.

If a fresh install did not activate the hook, run:

```bash
pnpm run prepare
```

Then confirm that `.git/hooks/pre-commit` exists. A GUI Git client launched outside
your shell may also need the pinned Node and pnpm binaries on its `PATH`.

## CI parity

GitHub Actions uses two stable required jobs:

- **Quality** installs the frozen lockfile, runs `pnpm verify`, and reports unit
  coverage.
- **Browser** waits for Quality, installs Chromium, runs the production suite and the
  non-visual `/lab` checks, and uploads seven-day failure artifacts.

Run `pnpm verify:full` for the closest local equivalent. CI has read-only repository
contents permission and no deployment credentials or deployment step.

## Git and review workflow

Every feature is implemented on its documented `codex/...` branch. Before each
commit:

1. Finish one coherent candidate and leave it unstaged.
2. Run the documented checks and inspect the complete diff.
3. Present the intent, architecture, behavior, file walkthrough, verification,
   risks, and proposed message.
4. Wait for explicit approval for that exact candidate.
5. Stage only the approved files and commit them.

Do not interpret approval of one commit as approval of the next. If a formatter,
linter, or requested revision changes the reviewed tree, present the updated diff
again. Never commit real contact addresses or secrets.

When the branch is complete, rebase it onto the latest `main`, rerun branch checks,
review the full branch diff, and obtain explicit merge approval. Use GitHub's
**Rebase and merge** option; do not squash the individually reviewed commits or
create a merge commit.

## Diagnose a Playwright failure from CI

Playwright records a trace for each failed browser-test attempt. A trace includes
the action timeline, DOM snapshots, screenshots, network activity, browser console
messages, timing, and the element resolved by each locator. Treat it as a debugging
artifact rather than a test report: the failed assertion and its surrounding state
remain the source of truth.

The repository configures this behavior in `playwright.config.ts`:

- `trace: "retain-on-failure"` records each attempt but retains only failed traces.
- `screenshot: "only-on-failure"` retains a screenshot for each failed attempt.
- `preserveOutput: "failures-only"` removes output for passing tests.
- CI retries a failing test twice. If all attempts fail, each failed attempt can
  have its own result directory and `trace.zip`.

The `Browser` GitHub Actions job uploads `test-results/` only when that job ends in
failure. A test that fails once and then passes on retry is reported as flaky, but
the job succeeds and does not upload an artifact under this failure-only policy.

### Download a trace from GitHub Actions

In the GitHub web interface:

1. Open **Actions**, select the failed **CI** workflow run, and open the **Browser**
   job.
2. Read **Run browser verification** first. It identifies the failing test and
   assertion.
3. Return to the workflow-run summary and find **Artifacts**.
4. Download `playwright-failure-N`, where `N` is the workflow run-attempt number.
5. Extract the archive. Find the `trace.zip` inside the directory for the failed
   test attempt.

The same artifact can be downloaded with the authenticated GitHub CLI. Replace the
example run ID with the numeric ID shown in the workflow-run URL:

```bash
run_id=1234567890
mkdir -p "test-results/ci-$run_id"
gh run download "$run_id" --dir "test-results/ci-$run_id"
find "test-results/ci-$run_id" -name trace.zip -print
```

`test-results/` is ignored by Git, so downloaded traces cannot be committed
accidentally through the normal `git add .` workflow.

### Open the trace

Use the repository-pinned Playwright version to open a downloaded trace:

```bash
pnpm exec playwright show-trace path/to/trace.zip
```

The viewer runs locally and provides these useful panels:

- **Actions**: inspect the locator, parameters, wait time, and error for each step.
- **Snapshots**: inspect the DOM before and after an action and use the snapshot
  developer tools to examine the resolved element.
- **Network**: look for failed, blocked, slow, or unexpected requests.
- **Console**: look for hydration errors, uncaught exceptions, and browser warnings.
- **Source**: correlate the selected action with the exact test line.

A practical diagnosis order is:

1. Select the failed assertion or the action immediately before it.
2. Compare its before/after DOM snapshots.
3. Confirm that the locator resolved to the intended element.
4. Inspect the action log for auto-waiting or actionability failures.
5. Check console and network panels for an earlier application failure.
6. Reproduce locally with the same browser project:

   ```bash
   pnpm exec playwright test --project=chromium --debug
   ```

7. After making a fix, run `pnpm test:e2e`, then `pnpm verify:full` before proposing
   the commit.

As an alternative, open [trace.playwright.dev](https://trace.playwright.dev/) and
drag `trace.zip` into the page. The official viewer processes the trace locally in
the browser. Prefer the pinned CLI command when investigating version-specific
behavior.

### GitLab CI equivalent

This repository currently uses GitHub Actions. If it is mirrored or migrated to
GitLab CI, preserve the same failure-only behavior with a job artifact:

```yaml
browser:
  stage: test
  image: mcr.microsoft.com/playwright:v1.62.1-noble
  script:
    - corepack enable
    - pnpm install --frozen-lockfile
    - pnpm test:e2e
  artifacts:
    when: on_failure
    expire_in: 7 days
    paths:
      - test-results/
```

Keep the Docker image version synchronized with `@playwright/test` in
`pnpm-lock.yaml`. After a failure, download the artifact from the GitLab job's
**Job artifacts** section, extract it, and use the same `show-trace` command above.

Use `artifacts: when: always` instead if passing and flaky jobs must also publish
their retained outputs. That increases storage use and is not this repository's
default policy.

### Trace privacy

Traces can contain rendered page text, requested URLs, network metadata, request or
response content, and console messages. Never print secrets, contact-form values,
email addresses, or authorization tokens from application code or tests. Keep CI
artifacts access-controlled, retain them only as long as needed, and do not attach a
trace to a public issue without inspecting it first.

Further reading:

- [Playwright Trace Viewer](https://playwright.dev/docs/trace-viewer)
- [Playwright continuous integration](https://playwright.dev/docs/ci)
- [GitHub workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data)
- [GitLab job artifacts](https://docs.gitlab.com/ci/jobs/job_artifacts/)

## Troubleshooting

### Node or pnpm engine warning

Confirm the active versions, then reload the repository pins:

```bash
node --version
pnpm --version
nvm install
nvm use
corepack enable
```

### The pre-commit hook is missing

Run `pnpm install --frozen-lockfile` or `pnpm run prepare`. Do not approve
`simple-git-hooks` as a dependency build; its postinstall is intentionally blocked.
If a GUI Git client cannot find pnpm, launch it from the configured shell or add the
version manager's shims to the GUI environment.

### Playwright cannot find Chromium

Install the repository's configured browser:

```bash
pnpm exec playwright install chromium
```

On a Linux machine missing browser system libraries, use:

```bash
pnpm exec playwright install --with-deps chromium
```

### A local port is already in use

Stop an Astro development server started by this project:

```bash
pnpm exec astro dev stop
```

Playwright reserves `127.0.0.1:4322` and intentionally refuses to reuse an existing
server so its production-style run remains isolated.

### Local checks pass but CI fails

Use the pinned Node and pnpm versions, reinstall with `--frozen-lockfile`, and run
`pnpm verify:full`. Compare CI's first failing command rather than only its final job
status. For browser failures, download and inspect the trace as described above.
