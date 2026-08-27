# Sky Lu Personal Website - Implementation Roadmap

Status: Stage 02 design system in progress
Last updated: 2026-08-26
Companion documents: `PLAN.md`, `AGENTS.md`

## 1. Purpose

This document converts `PLAN.md` into dependency-ordered, reviewable Git branches and commit candidates.

It is an execution plan, not blanket authorization to commit. Every commit candidate must pass the pre-commit review protocol in `AGENTS.md`, and the user must explicitly approve that exact commit before it is staged or committed.

## 2. Delivery model

### 2.1 Repository lifecycle

Repository bootstrapping uses one minimal reviewed root commit before normal feature work:

1. Review and create one root commit on `main` containing only `.gitignore`: `chore: initialize repository`.
2. Create `codex/docs/project-governance` from that root.
3. Commit `PLAN.md`, `AGENTS.md`, and `IMPLEMENTATIONS.md` on the governance branch through the normal approval gate.
4. Review and merge the governance branch into `main`.
5. From that point onward, make no direct commits to `main`.

The root commit is a one-time Git bootstrap and repository-safety baseline, not a product feature. It must still be explained and explicitly approved before `.gitignore` is staged or committed.

### 2.2 Normal feature flow

For every later branch:

```text
latest reviewed main
  -> create codex/<type>/<feature>
  -> implement one commit candidate
  -> run checks and inspect diff
  -> present pre-commit review package
  -> wait for explicit approval
  -> stage and commit
  -> repeat for the next candidate
  -> run branch-level checks
  -> present branch/PR review
  -> wait for merge authorization
  -> rebase merge through GitHub
  -> update local main
  -> create the next dependent branch
```

Do not stack dependent branches by default. If a later branch must begin before an earlier branch merges, document the dependency and ask the user to approve a stacked-branch workflow.

Every feature branch uses a rebase merge. On GitHub, select **Rebase and merge**. For a local-only branch, rebase it onto current `main`, rerun affected verification, and fast-forward `main` with `--ff-only`. Preserve the approved commits; do not squash them or create feature merge commits. Every push, rebase of published history, and merge still requires explicit user authorization.

### 2.3 Commit review packet

Before each commit, provide:

1. Intent and non-goals.
2. Architectural fit and downstream dependencies.
3. How the code works.
4. File-by-file code walkthrough with line links.
5. Verification performed and results.
6. Diff statistics, risks, limitations, and privacy check.
7. Proposed commit message.
8. The explicit question: `Approve this commit?`

No staging or commit occurs until approval.

## 3. Dependency graph

```text
00 Governance
  |
  v
01 Foundation
  |
  v
02 Design System
  |
  v
03 Content Model and Core Routes
  |
  +--------------------+
  |                    |
  v                    v
04 Static Homepage   05 Rich MDX
  |                    |
  +---------+----------+
            |
            v
06 Research Diagram and Motion
            |
            v
07 Interactive Guitar
            |
            v
08 Command Palette and Search
            |
            v
09 Cloudflare, Privacy, and Security
            |
            v
10 Quality and Launch Hardening
            |
            v
11 Deferred Portrait and Content Polish
```

The work is intentionally sequential even where branches could be parallelized. Sequential branches minimize conflicts, keep reviews grounded in the latest approved architecture, and ensure `main` remains deployable.

## 4. Branch overview

| Stage | Branch | Feature outcome | Depends on |
| ---: | --- | --- | --- |
| 00 | `codex/docs/project-governance` | Versioned product plan and working rules | Root commit |
| 01 | `codex/chore/foundation` | Buildable Astro project with quality tooling | 00 |
| 02 | `codex/feat/design-system` | Light/dark visual system, shell primitives, `/lab` | 01 |
| 03 | `codex/feat/content-model` | Typed profile/blog/project data and core routes | 02 |
| 04 | `codex/feat/homepage` | Complete static homepage without signature animations | 03 |
| 05 | `codex/feat/rich-mdx` | Code, math, Mermaid, figures, forms, article layout | 04 |
| 06 | `codex/feat/systems-motion` | Original research-section network diagram and authored motion | 05 |
| 07 | `codex/feat/guitar-widget` | Six playable synthesized strings as the homepage hero visual | 06 |
| 08 | `codex/feat/command-search` | Keyboard-accessible site/post search | 07 |
| 09 | `codex/feat/cloudflare-production` | Static deployment, email privacy, crawler and security policy | 08 |
| 10 | `codex/chore/launch-hardening` | Accessibility, performance, observability, release checks | 09 |
| 11 | `codex/feat/portrait-content-polish` | Photograph, canonical links, final public content | 10 and user assets |

### 4.1 Progress log

This table records the repository state when the current roadmap revision was
prepared. Uncommitted work is identified explicitly and does not count as durable
progress until it passes the approval gate.

| Stage | Status | Evidence and next action |
| ---: | --- | --- |
| 00 | Complete on `main` | Bootstrap `4868a3f`; governance commits `5e47956` and `08e99b8`; merged as `da99c11`. |
| 01 | Complete on `main` | PR [#1](https://github.com/zlxlty/sky-lu-personal-website/pull/1) passed Quality and Browser CI, then rebase-merged as seven preserved commits through `3681ca7`. |
| 02 | Active; branch-review cleanup | Commits 02.1 through 02.6 are pushed on `codex/feat/design-system`; Commit 02.7 addresses the branch review's dark-surface contrast finding, followed by annotation-stack isolation and final documentation cleanup. |
| 03-11 | Not started | Begin each stage only after its dependency is reviewed and rebase-merged into `main`. |

Stage 01 commit ledger:

| Candidate | Status | Commit or evidence |
| --- | --- | --- |
| 01.1 Astro scaffold | Rebase-merged | `ebe9b30` |
| 01.2 rebase policy | Rebase-merged | `384caf1` |
| 01.3 React, MDX, and Tailwind | Rebase-merged | `b6c2cad` |
| 01.4 code quality | Rebase-merged | `bc5bbb1` |
| 01.5 Playwright and CI | Rebase-merged; CI passed | `84a7943` |
| 01.6 local developer tooling | Rebase-merged; CI passed | `f8ac86c` |
| 01.7 development documentation | Rebase-merged; CI passed | `3681ca7` |

Stage 02 commit ledger:

| Candidate | Status | Commit or evidence |
| --- | --- | --- |
| 02.1 tokens and typography | Committed and pushed | `8bbe220` on `origin/codex/feat/design-system`. |
| 02.2 blueprint layout | Committed and pushed | `0a15bf5` on `origin/codex/feat/design-system`. |
| 02.3 sticky navigation and themes | Committed and pushed | `a52e32e` on `origin/codex/feat/design-system`. |
| 02.4 interactive controls | Committed and pushed | `b61cdfe` on `origin/codex/feat/design-system`. |
| 02.5 component lab | Committed and pushed | `5bd9eee` on `origin/codex/feat/design-system`. |
| 02.6 rail annotations | Committed and pushed | `fbd8af6` on `origin/codex/feat/design-system`. |
| 02.7 dark raised-surface contrast | Committed and pushed | `1b5c637` on `origin/codex/feat/design-system`. |
| 02.8 annotation stack isolation | Implemented, pending review | Current working-tree candidate; proposed message `fix: isolate rail annotations from panel flow`. |
| 02.9 completion documentation | Planned | Record branch completion and refresh the README project phase after final verification. |

## 5. Stage 00 - Repository governance

### Branch

`codex/docs/project-governance`

### Goal

Create the versioned source of truth for product direction, engineering workflow, branch sequencing, privacy, and approval gates.

### Commit 00.0 - one-time main bootstrap

Proposed message:

```text
chore: initialize repository
```

Scope:

- `.gitignore` only.
- Ignore dependency directories, Astro/Vite build state and output, coverage, Playwright artifacts, Wrangler local state, logs, OS noise, and local environment/secret files.
- Keep `.env.example` and any reviewed example-variable files explicitly trackable.
- Do not ignore, edit, stage, or delete the existing `.opencode/` directory as part of this commit.
- Establishes a real `main` reference so all documented work can occur on branches and merge normally.

Review checks:

- Confirm repository is on unborn `main`.
- Confirm no file is staged before presenting the review package.
- Walk through every ignore rule and why the generated or secret-bearing path should remain untracked.
- Use `git check-ignore -v` with representative paths to verify intended rules and exceptions.
- Confirm `.env.example` is not ignored and `.env.local` is ignored.
- Confirm `.opencode/` is untouched and remains outside the commit.
- Obtain explicit approval before staging `.gitignore` or creating the commit.

### Commit 00.1 - product and architecture plan

Proposed message:

```text
docs: define product and architecture plan
```

Files:

- `PLAN.md`

Walkthrough focus:

- Product identity and homepage content.
- Astro/static/islands decisions.
- Guitar state machine and audio design.
- MDX pipeline.
- Cloudflare deployment and email protection.
- Quality gates and phased delivery.

Checks:

- Markdown structure and balanced fences.
- No raw Brown or personal email addresses.
- All external links are plausible and use HTTPS where available.
- No accidental changes under `.opencode/`.

### Commit 00.2 - agent rules and implementation roadmap

Proposed message:

```text
docs: add commit review rules and implementation roadmap
```

Files:

- `AGENTS.md`
- `IMPLEMENTATIONS.md`

Walkthrough focus:

- Mandatory pre-commit approval gate.
- Branch and merge policy.
- Commit review packet.
- Dependency graph and feature branches.
- Privacy and testing requirements.

Checks:

- Markdown structure and balanced fences.
- Branch names are unique and consistently use `codex/`.
- Every implementation branch has acceptance criteria.
- No rule allows silent staging, committing, pushing, or merging.

### Branch acceptance criteria

- The three documents agree about architecture and sequencing.
- User approves both documentation commits.
- Branch diff contains only the three Markdown documents.
- Governance branch receives explicit merge approval.

## 6. Stage 01 - Astro foundation

### Branch

`codex/chore/foundation`

### Goal

Create a minimal, reproducible, buildable Astro repository with a documented command contract, editor support, local hooks, tests, CI parity, and enough developer guidance for Sky to run and change the project independently. Do not prematurely implement product features.

### Commit 01.1 - scaffold the Astro application

Proposed message:

```text
chore: scaffold Astro application
```

Scope:

- `package.json` and pnpm lockfile.
- Astro configuration.
- Strict TypeScript configuration.
- Minimal `src/pages/index.astro` proving static generation.
- Minimal global stylesheet and public assets needed by the scaffold.
- `.editorconfig` and `.nvmrc` or an equivalent reviewed runtime declaration.
- Extend the root `.gitignore` only if the scaffold introduces a new generated path; explain any new rule in this commit's review.
- `package.json#engines` and `package.json#packageManager` aligned with the pinned Node and pnpm versions.
- Package scripts for `dev`, `build`, `preview`, and `check`.

Non-goals:

- No final homepage.
- No React, MDX, Tailwind, shadcn, Anime.js, Tone.js, or Cloudflare adapter yet.
- No deployment.

Checks:

- `pnpm install --frozen-lockfile` after lockfile creation.
- `pnpm check`.
- `pnpm build`.
- Inspect generated `dist/` and confirm a static index page.

### Commit 01.2 - require rebase merges

Proposed message:

```text
docs: require rebase merges
```

Scope:

- Record **Rebase and merge** as the only feature-branch merge method.
- Define the equivalent local flow: rebase onto current `main`, rerun affected checks, and fast-forward with `--ff-only`.
- Preserve individually approved commits by excluding squash and feature merge commits.
- Keep explicit authorization gates for pushes, published-history rewrites, and merges.
- Configure the future GitHub repository policy accordingly.

Checks:

- `AGENTS.md` and this roadmap use the same merge terminology.
- No remaining recommendation permits squash or feature merge commits.
- Conflict resolution returns to the normal review gate whenever the reviewed tree changes.
- Markdown and privacy checks pass.

### Commit 01.3 - add React, MDX, and Tailwind integrations

Proposed message:

```text
chore: configure React MDX and Tailwind
```

Scope:

- `@astrojs/react`.
- `@astrojs/mdx`.
- Tailwind CSS v4 and its Vite integration.
- Import aliases used by shadcn-compatible code.
- A static smoke component and a non-hydrated React smoke component to prove boundaries.

Architectural walkthrough:

- Astro owns routing and rendering.
- React components render static HTML until a `client:*` directive is deliberately added.
- MDX is compile-time content.
- Tailwind uses the same Vite pipeline without adding a separate SPA build.

Checks:

- Typecheck and build.
- Inspect generated HTML for the non-hydrated React component.
- Confirm the smoke component adds no unnecessary client script.

### Commit 01.4 - add formatting, linting, and unit-test tooling

Proposed message:

```text
chore: add code quality tooling
```

Scope:

- ESLint configuration for Astro, TypeScript, and React.
- Prettier configuration with Astro and Tailwind support.
- Vitest configuration.
- One deterministic sample unit test.
- Unit coverage provider, without an arbitrary coverage threshold before real logic exists.
- Scripts: `format`, `format:check`, `lint`, `lint:fix`, `test`, `test:watch`, and `test:coverage`.

Checks:

- `pnpm format:check`.
- `pnpm lint`.
- `pnpm check`.
- `pnpm test`.
- `pnpm build`.

### Commit 01.5 - add Playwright and continuous integration

Proposed message:

```text
ci: verify build and smoke tests
```

Scope:

- Playwright configuration.
- A smoke test that runs against the production preview.
- Axe integration for later representative-page accessibility checks.
- GitHub Actions workflow using a frozen lockfile.
- Dependency cache keyed by lockfile.
- Required job names documented for later GitHub branch protection.
- Stable scripts: `test:e2e`, `test:e2e:ui`, `test:e2e:update`, `verify`, and `verify:full`.
- Failure-only Playwright traces/screenshots/artifacts.
- Initial `DEVELOPMENT.md` instructions for retrieving, inspecting, and safely
  handling failed Playwright traces from GitHub Actions, with a GitLab CI
  equivalent.

Non-goals:

- No deploy job.
- No stored browser artifacts unless a test fails.

Checks:

- Run the exact CI commands locally where possible.
- `pnpm test:e2e`.
- `pnpm verify` and `pnpm verify:full`.
- Verify workflow YAML syntax.

### Commit 01.6 - add editor and pre-commit tooling

Proposed message:

```text
chore: add local developer tooling
```

Scope:

- Optional VS Code extension recommendations for Astro, ESLint, Prettier, Tailwind, MDX, and Playwright.
- Conservative repository VS Code settings that use local formatters without rewriting unrelated files.
- `simple-git-hooks` plus check-only `lint-staged` tasks, selected over Husky to
  keep hook installation and configuration small.
- Pre-commit hook limited to approved staged files; it may format/lint but must never stage extra files, run deployment, or create a commit.
- Pull-request template containing architecture, testing, privacy, screenshots, and documentation checklists.
- Initial `README.md` with prerequisites, a first-clone setup sequence, automatic
  hook activation, hook recovery, and local verification commands.
- `DEVELOPMENT.md` instructions for optional editor setup, hook activation,
  check-only behavior, and recovery from a failed hook.

Architectural walkthrough:

- Local hooks improve feedback but CI remains authoritative.
- The user approval gate happens before staging; the hook validates the already approved candidate.
- Editor recommendations are optional and must not become a hidden build dependency.

Checks:

- Fresh shell install activates the hook through the documented package lifecycle.
- A deliberately malformed staged fixture causes the hook to fail without committing.
- Unstaged/unrelated files remain unchanged.
- `pnpm verify` still passes outside the editor.

### Commit 01.7 - add local development documentation

Proposed message:

```text
docs: add local development guide
```

Scope:

- Expand `README.md` with the complete project overview and command summary.
- Expand `DEVELOPMENT.md` with runtime setup, pnpm/Corepack, install, environment setup, dev server, production preview, test selection, `/lab`, debugging, CI parity, Git review flow, and troubleshooting.
- `.env.example` with placeholders only and comments explaining when values become required.
- Document the future `cf:preview` contract as unavailable until Stage 09 rather than providing a broken command early.

Checks:

- Follow the quick start from a clean temporary clone or equivalent clean checkout.
- Run every command documented as currently available.
- Confirm every linked local document/path exists.
- Confirm no real email, token, account ID, or Cloudflare identifier is present.

### Branch acceptance criteria

- Fresh clone installs and builds reproducibly.
- All baseline checks pass.
- `pnpm verify` and `pnpm verify:full` provide local CI parity.
- Static page works without JavaScript.
- No production feature dependency is installed early.
- CI has no deployment permissions.
- Optional editor support does not replace command-line tooling.
- Hooks validate only approved staged files and never commit automatically.
- A new developer can complete the documented quick start without undocumented steps.

## 7. Stage 02 - Design system and component lab

### Branch

`codex/feat/design-system`

### Goal

Implement the warm technical-document visual system, light/dark themes, reusable shell primitives, and a development-only component lab.

### Commit 02.1 - add design tokens and self-hosted typography

Proposed message:

```text
feat: add color tokens and typography
```

Scope:

- Warm light palette built from `#FCF3E6` and `#38332F`, plus a brown dark palette using `#2B2724` and `#AE9877`.
- IBM Plex Sans and IBM Plex Mono self-hosting after license/source verification.
- Type scale plus semantic border/rule, focus, and motion tokens.
- Base document, selection, link, and focus styles.

Checks:

- Build.
- Visual inspection in both themes using a temporary specimen page.
- Contrast measurements for body, muted text, links, focus, and brass accents.
- Confirm fonts are served locally and do not cause obvious layout shift.

### Commit 02.2 - port the blueprint document layout

Committed message:

```text
feat: port blueprint layout system
```

Scope:

- MIT-licensed `BlueprintPage`, `StripeSeparator`, and the `Panel` family
  (`Panel`, `PanelHeader`, `PanelTitle`, `PanelTitleSup`, `PanelDescription`,
  `PanelContent`, and `PanelRuleBand`) migrated from `ncdai/chanhdai.com` revision
  `b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321`.
- Upstream screen-line and diagonal-stripe utilities adapted to Sky's warm
  design tokens.
- Static React rendering through Astro without a client directive, hydrated
  island, or browser JavaScript.
- Skip link, semantic landmarks, symmetric mobile gutters, a centered desktop
  rail, and a regression keeping ordinary figures within that rail.
- Tailwind-first component layout: panel headers, content, and metadata use a
  consistent fixed `px-4` inset; content regions use `py-4`; responsive spacing
  is introduced only for a content-driven layout change such as the hero's
  vertical scale.
- No parallel numeric spacing-token layer. Page-specific spacing, layout, type,
  and color composition stays in Tailwind utilities at the Astro call site.
- Shared CSS is reserved for semantic tokens, document-level base styles, and
  reusable blueprint behavior that needs pseudo-elements or adjacency
  selectors.
- Self-hosted variable Geist Sans assigned only to the display-heading role,
  paired with IBM Plex Sans body text and IBM Plex Mono metadata, with a preload
  for the Latin Geist asset used above the fold.
- The hero's first glyph uses a local Tailwind optical-indent utility so its
  visible edge aligns with the eyebrow without moving the document rail.
- A direct-child `PanelRuleBand` can be placed immediately after a panel title
  header, between sections, or at a panel's end. It renders the source-faithful
  `h-4` blank band with one full-bleed rule on each edge.
- The `Panel` stack and each `PanelRuleBand` follow a single-paint-owner
  adjacency contract. Shared parent/child or sibling boundaries never
  alpha-stack, and callers do not suppress borders with one-off
  `screen-line-*-none` overrides.
- `StripeSeparator` remains the taller diagonal full-bleed separator between
  panels; it is distinct from a panel's paired rule band.
- Per-file attribution, `THIRD_PARTY_NOTICES.md`, and a local-only ignored
  reference checkout.

Checks:

- Responsive screenshots at 360, 768, 1024, and 1440 px.
- Keyboard skip-link behavior.
- No horizontal overflow.
- Shared `px-4` inline alignment across panel headers, content, and metadata at
  every tested viewport.
- Loaded-font glyph metrics keep the hero title optically aligned with its
  eyebrow.
- Paired-rule band count, height, boundary joins, and compact title-header
  composition, including a `PanelRuleBand` placed directly after a title.
- Single visible paint ownership for every physical screen-rule coordinate,
  including sibling and parent-child seams.
- Panel callers render clean boundaries without `screen-line-*-none` overrides.
- Unit regression confirms no numeric `--space-*` token scale is reintroduced.
- Confirm the static layout emits no hydration directive or client bundle.
- Build and accessibility smoke check.
- Confirm zero upstream personal data, marks, portraits, or branded assets.

### Commit 02.3 - add sticky navigation and theme control

Proposed message:

```text
feat: add sticky navigation and persistent themes
```

Scope:

- No-flash theme bootstrap.
- System preference on first visit.
- Persisted explicit choice.
- Accessible theme control.
- `theme-color` and `color-scheme` synchronization.
- MIT-attributed compact sticky header shell adapted from `ncdai/chanhdai.com`.
- Empty navigation rail with the theme control aligned right; links and command
  controls remain deferred until their routes and primitives exist.
- Shared shell-boundary ownership between the sticky header and first panel.

Architectural walkthrough:

- Keep the earliest theme decision outside a large React island.
- Use a tiny client script and an Astro-rendered control where practical.
- Avoid hydration solely for reading `localStorage`.

Checks:

- First load in light and dark system modes.
- Explicit choice persists across reload.
- No console/hydration errors.
- Keyboard and screen-reader label review.
- Sticky behavior, rail alignment, and clean header-to-panel boundary at mobile
  and desktop widths.

### Commit 02.4 - add curated shadcn-compatible controls

Proposed message:

```text
feat: add core interactive controls
```

Scope:

- React-source Button, Tooltip, Badge, Separator, Collapsible, Dialog, Sheet, and
  Command primitives only.
- Reuse the existing `cn` utility; add variant handling only where a component
  has a real public variant API.
- Use Base UI for accessible control behavior, CVA for the public Button and
  Badge variant APIs, and `cmdk` for Command. Use local SVGs rather than adding
  an icon package.
- Adapt colors and focus behavior to project tokens.
- Preserve the Astro island boundary: static React controls render without
  client JavaScript, while a future interactive feature hydrates one composition
  island rather than each primitive.

Checks:

- Dependency diff review.
- Tree/build output inspection.
- Keyboard, focus, portal, and theme behavior.
- Static-render checks for non-interactive controls and DOM integration checks
  for interactive primitives.
- No wholesale registry import.

### Commit 02.5 - add the development component lab

Proposed message:

```text
feat: add development component lab
```

Scope:

- `/lab` specimens for tokens, typography, layout, controls, focus, loading, and error states.
- Review-driven danger foreground, emphasis, and on-danger roles with WCAG AA contrast in both themes.
- A development-command integration gate preventing production exposure.
- A separate Playwright lab workflow for interactions, Axe, responsive behavior,
  and initial platform-specific visual-regression targets.

Checks:

- `/lab` available in development.
- `/lab` absent or returns 404 in production build.
- `pnpm test:lab` for interactions, Axe, and reviewed light/dark responsive snapshots.
- `pnpm test:lab:ci` for the portable CI subset without platform-specific snapshots.
- `pnpm test:e2e` for the production artifact exclusion and existing homepage contract.

### Commit 02.6 - add rail annotations

Proposed message:

```text
feat: add rail annotations
```

Scope:

- A static `RailAnnotation` blueprint module with left/right gutter placement,
  start/center/end alignment, up/down arrow direction with matching copy order,
  an automatically mirrored hand-drawn arrow, and wide-screen visibility
  guards.
- Caveat variable font self-hosted through Fontsource and limited to decorative
  annotation text.
- Both annotation sides exposed through `/lab` without adding another island.
- Upstream code and Caveat font attribution.

Checks:

- Static-render interface tests for side, alignment, decorative semantics,
  inward arrow direction, and copy/arrow ordering.
- Browser geometry checks at the `xl` breakpoint and reviewed 1440 px visual
  coverage.
- Font dependency, local bundling, production build, and output inspection.

### Commit 02.7 - meet dark raised-surface contrast requirements

Proposed message:

```text
fix: meet dark surface contrast requirements
```

Scope:

- Keep the approved dark foreground while darkening the raised-surface token
  enough for normal text to meet WCAG AA.
- Apply the same token to explicit and system-preference dark themes.
- Exercise normal foreground and muted text across every semantic surface.
- Run the component lab accessibility audit in both visual themes.

Checks:

- Token-level WCAG contrast assertions for paper, surface, and raised surface.
- Light- and dark-theme Axe audits in `/lab`.

### Commit 02.8 - isolate annotations from panel stack ownership

Proposed message:

```text
fix: isolate rail annotations from panel flow
```

Scope:

- Mark decorative absolute overlays as outside the Panel adjacency contract.
- Preserve absolute start/center/end placement with multiple annotations.
- Ensure overlays never acquire screen rules or become paint owners.

Checks:

- Browser geometry and computed-style assertions with multiple annotations.
- Single-paint-owner regression coverage at annotated panel boundaries.

### Commit 02.9 - record design-system completion

Proposed message:

```text
docs: record design system completion
```

Scope:

- Record the final Stage 02 commit ledger and CI evidence.
- Refresh the README project phase and component-lab availability.
- Capture accepted maintainability follow-ups without expanding Stage 02.

### Branch acceptance criteria

- The visual system is recognizable without copying Chanhdai branding.
- Themes meet the documented contrast requirements.
- Destructive controls use distinct danger foreground, emphasis, and on-danger roles.
- Static primitives ship no client JavaScript.
- Panel seams and explicit paired rule bands maintain one paint owner per
  physical boundary.
- Component-local layout and spacing remain Tailwind-first without a duplicate
  numeric spacing-token scale.
- Only the approved control dependencies are installed.
- `/lab` is development-only.
- Rail annotations remain decorative, stay outside the content rail, point
  inward automatically, and disappear before the gutters can hold them.

## 8. Stage 03 - Content model and core routes

### Branch

`codex/feat/content-model`

### Goal

Create typed, reusable content sources and static route skeletons without embedding personal contact values in Git.

### Commit 03.1 - add typed profile and portfolio data

Proposed message:

```text
feat: add typed profile and portfolio data
```

Scope:

- Typed profile, education, experience, research, skills, and project data.
- Approved public claims from the résumé.
- ATLAS Group and Nikos Vasilakis references.
- Tundra and KVonset project data.
- Contact fields represented as environment-backed values or typed unavailable states, never literals.

Checks:

- Typecheck.
- Content-fact walkthrough against `PLAN.md` and the résumé.
- Secret/email search.
- No invented canonical Tundra URL.

### Commit 03.2 - configure blog and project content collections

Proposed message:

```text
feat: add typed content collections
```

Scope:

- `src/content.config.ts`.
- Strict blog and project schemas.
- Draft/featured/tag/date fields.
- One minimal fixture article and one project case-study fixture.
- Draft filtering utility with tests.

Checks:

- Schema failure test for invalid fixtures.
- Draft filtering tests.
- `astro check`, unit tests, and build.

### Commit 03.3 - add writing, projects, and CV routes

Proposed message:

```text
feat: add core content routes
```

Scope:

- `/writing` index.
- `/projects` index.
- `/projects/[slug]` static route.
- `/cv` accessible web résumé.
- Shared empty and not-found states.

Non-goals:

- Rich article rendering arrives in Stage 05.
- No PDF publishing.
- No dynamic filtering API.

Checks:

- Static route generation.
- No-JavaScript navigation.
- Heading/landmark order.
- Responsive visual review.

### Commit 03.4 - add metadata, feeds, and crawler artifacts

Proposed message:

```text
feat: add SEO metadata and content feeds
```

Scope:

- Canonical URL helper.
- Base Open Graph and social metadata.
- Sitemap integration.
- RSS feed.
- Initial `robots.txt` policy allowing search and link previews while listing disallowed AI training crawlers.
- JSON-LD for Person/Website without email addresses.

Checks:

- Generated XML/text artifacts.
- Drafts absent from sitemap/feed/searchable output.
- No contact email in metadata or feeds.
- Metadata snapshot tests where useful.

### Branch acceptance criteria

- All public facts are typed and centrally maintained.
- Blog and project schema errors fail the build.
- Draft content never reaches production artifacts.
- Core routes are static and accessible.
- Contact values remain outside source control.

## 9. Stage 04 - Static homepage

### Branch

`codex/feat/homepage`

### Goal

Build the complete content and layout of the homepage, including a static hero-guitar placeholder, before adding signature motion or playable behavior.

### Commit 04.1 - add site header and footer

Proposed message:

```text
feat: add responsive site navigation
```

Scope:

- Sticky header.
- Desktop and mobile navigation.
- Footer metadata, attribution, and external links.
- Placeholder controls for command search and theme integration.
- Skip link and anchor offsets.

Checks:

- Responsive behavior.
- Full keyboard path.
- No-JavaScript links.
- External link security attributes.

### Commit 04.2 - add static hero and identity content

Proposed message:

```text
feat: add homepage identity hero
```

Scope:

- Static six-string hero placeholder with realistic gauge variation.
- Sky Lu identity copy and four identity labels.
- Portrait placeholder that cannot be mistaken for a real photograph.
- Primary calls to writing, projects, GitHub, and CV.

Checks:

- First-viewport comprehension at mobile and desktop widths.
- Layout shift review.
- Reduced-motion/no-JavaScript baseline.

### Commit 04.3 - add overview, research, and selected work

Proposed message:

```text
feat: add research and selected work sections
```

Scope:

- Overview metadata.
- ATLAS Group research section.
- Nikos Vasilakis attribution.
- Dynamic Pages, efficient LLM serving, Tundra, and KVonset records.
- Project metrics and approved public claims.

Checks:

- Copy review against approved résumé content.
- Outbound ATLAS/team links.
- No invented research title, paper, or Tundra URL.
- Responsive presentation of long technical phrases.

### Commit 04.4 - add experience disclosures

Proposed message:

```text
feat: add expandable experience timeline
```

Scope:

- Cloudflare, Z.ai, Flowith, and QuantInfinite rows.
- Accessible Collapsible behavior.
- Static expanded content remains meaningful without animation.
- Dates, locations, and concise contributions.

Checks:

- Keyboard disclosure behavior.
- `aria-expanded` and focus behavior.
- No layout jump from opening and closing records.
- No accidental exposure of non-approved résumé fields.

### Commit 04.5 - add jazz and writing previews

Proposed message:

```text
feat: add jazz and writing homepage sections
```

Scope:

- Jazz narrative copy, a link back to the hero instrument, and a concise repeated usage hint.
- No second guitar component or misleading audio control in the lower section.
- Latest three writing entries.
- Section anchors and final homepage order.

Checks:

- No misleading functional audio control before audio exists.
- Writing preview respects drafts.
- Homepage builds with JavaScript disabled.

### Branch acceptance criteria

- All planned homepage sections exist and are coherent without signature interactions.
- Homepage works with JavaScript disabled.
- Mobile and desktop layouts are reviewed in both themes.
- Static homepage initial JavaScript remains minimal.
- Claims, affiliations, and dates are accurate.

## 10. Stage 05 - Rich MDX publishing

### Branch

`codex/feat/rich-mdx`

### Goal

Deliver a durable article system for prose, code, mathematics, diagrams, figures, and typed embedded components.

### Commit 05.1 - add article route and prose layout

Proposed message:

```text
feat: add MDX article rendering
```

Scope:

- `/writing/[slug]` static route.
- Article header, dates, tags, reading metadata, and canonical links.
- Prose typography.
- Previous/next navigation.
- Draft exclusion.

Checks:

- Static path generation.
- Long-form responsive typography.
- Heading links and focus targets.
- No article client runtime by default.

### Commit 05.2 - add GFM, code, and math support

Proposed message:

```text
feat: add code and math authoring
```

Scope:

- GitHub-flavored Markdown.
- Shiki code rendering.
- `remark-math`, `rehype-katex`, and locally served KaTeX styling.
- Code overflow and copy behavior only if it can be added without hydrating every block.

Checks:

- Fixture article with tables, task lists, inline code, fenced code, inline math, and display math.
- Light/dark contrast.
- Horizontal code scrolling on mobile.
- No remote runtime assets.

### Commit 05.3 - add static MDX components

Proposed message:

```text
feat: add MDX figures and callouts
```

Scope:

- Figure, caption/source, callout, key-value table, and form-field primitives.
- Standard documented import pattern for `.mdx` files.
- Semantic HTML and no hydration for static components.

Checks:

- Component fixture coverage.
- Accessible captions and form labels.
- No invalid nesting in generated HTML.

### Commit 05.4 - add Mermaid diagrams

Proposed message:

```text
feat: add lazy Mermaid diagrams
```

Scope:

- Custom Mermaid React island.
- Dynamic import only on pages containing a diagram.
- Theme synchronization.
- Textual fallback or adjacent accessible explanation.
- Error boundary and visible diagram error state.

Checks:

- Mermaid absent from article bundles without diagrams.
- Diagram renders in both themes.
- Theme change updates the diagram.
- Invalid diagram produces a contained error.

### Commit 05.5 - document interactive MDX and form boundaries

Proposed message:

```text
docs: document rich MDX authoring
```

Scope:

- Create `CONTENT.md` with frontmatter, imports, code, math, Mermaid, figures, forms, images, drafts, and interactive-demo rules.
- Link the authoring guide from `README.md` and `DEVELOPMENT.md`.
- State clearly that v1 forms render UI but have no generic production submission endpoint.
- Add test fixtures only when they help prevent regression.

Checks:

- Follow the guide to author a sample article from scratch.
- Verify every documented import/path exists.
- Run every documented content-validation command.

### Branch acceptance criteria

- Plain posts remain zero-client-JavaScript.
- Mermaid loads only where used.
- Code and math work in both themes.
- Forms and figures are semantic.
- Authoring documentation matches actual APIs.

## 11. Stage 06 - Research diagram and authored motion

### Branch

`codex/feat/systems-motion`

### Goal

Add an original, lightweight systems diagram to the research section and introduce restrained site motion without competing with the guitar's role as the hero interaction.

### Commit 06.1 - implement the static research network illustration

Proposed message:

```text
feat: add original network research illustration
```

Scope:

- Semantic SVG with nodes, links, queues, and packet paths.
- Placement within the ATLAS/research section rather than the hero.
- Theme-aware tokens.
- Figure caption and no-JavaScript presentation.
- No copied Chanhdai geometry or assets.

Checks:

- Originality review against the reference.
- Crisp rendering at supported widths and DPRs.
- SVG accessibility and decorative-element hiding.

### Commit 06.2 - add pointer-responsive routing

Proposed message:

```text
feat: add pointer-responsive packet routes
```

Scope:

- Small vanilla client controller.
- Nearest-route pointer response.
- Packet traversal scheduling.
- IntersectionObserver and visibility pause.
- Cleanup on navigation/unmount.

Checks:

- No React root.
- No memory/timer leak during repeated navigation.
- Pointer and touch-safe behavior.
- No interaction blocks scrolling.
- Pointer behavior remains scoped to the research figure and cannot arm or interfere with the hero guitar.

### Commit 06.3 - add restrained Anime.js motion

Proposed message:

```text
feat: add authored homepage motion
```

Scope:

- Anime.js v4 for selected entrances, keycap/control feedback, and disclosure polish.
- Scoped lifecycle cleanup.
- Reduced-motion replacements.
- Avoid scroll animation on every section.

Checks:

- Verify Anime.js import size and paths.
- Reduced-motion mode.
- Hidden/offscreen pause behavior.
- Light/dark and mobile visual review.

### Branch acceptance criteria

- The research figure is original and aligned with the site's systems identity.
- Static fallback remains polished.
- Motion stops when hidden/offscreen.
- Reduced-motion visitors receive no decorative traversal.
- No console errors or material layout shift.

## 12. Stage 07 - Interactive guitar

### Branch

`codex/feat/guitar-widget`

### Goal

Implement the six-string standard-tuned guitar as the homepage hero's primary interactive visual, with synthesized plucks, ordered strumming, `F`-key arming, mobile fallback, and accessible alternatives.

### Commit 07.1 - add pure string-crossing geometry

Proposed message:

```text
feat: add guitar crossing geometry
```

Scope:

- Framework-independent pointer segment/string intersection.
- Crossing fraction calculation.
- Multi-string ordering.
- Playable-span constraint.
- Velocity mapping and per-string cooldown helpers.
- Comprehensive unit tests.

Non-goals:

- No React, SVG, animation, Tone.js, or browser audio.

Checks:

- Unit tests for one string, multiple strings, both directions, outside span, parallel movement, jitter, and clamping.
- Mutation-style edge-case review for zero-length movement and exact-baseline starts.

### Commit 07.2 - add six-string SVG and visual physics

Proposed message:

```text
feat: add animated guitar strings
```

Scope:

- React island shell.
- Integration boundary sized for the existing hero slot; development states also render in `/lab`.
- Six horizontal SVG strings with documented widths.
- Separate transparent hit areas.
- Shared `requestAnimationFrame` damped-string loop.
- Stop-on-idle and unmount cleanup.
- Reduced-motion pulse fallback.

Checks:

- Visual gauge ordering and fixed endpoints.
- One animation loop for all strings.
- No React state updates per frame.
- Performance profile during six-string decay.
- Reduced-motion behavior.

### Commit 07.3 - add Tone.js pluck synthesis

Proposed message:

```text
feat: add synthesized guitar audio
```

Scope:

- Lazy Tone.js import.
- Explicit audio-context unlock.
- Six `Tone.PluckSynth` voices in standard tuning.
- Shared gain and limiter.
- Gauge-specific dampening/resonance.
- Mute ramp, error state, and node disposal.

Checks:

- Tone.js absent from initial homepage bundle.
- No audio before explicit unmute.
- Six notes can overlap.
- Mute/unmute has no audible click in manual review.
- Cleanup tests using mocked Tone nodes.

### Commit 07.4 - implement `F`-armed plucking and strumming

Proposed message:

```text
feat: add armed guitar interactions
```

Scope:

- `F` keydown/keyup state machine.
- Pointer-local coordinate tracking.
- Single pluck and ordered strum scheduling.
- Visual velocity/direction response.
- Reset on blur, hidden tab, pointer exit, route change, and unmount.
- Ignore global shortcut in editable controls.

Checks:

- Browser tests for armed/unarmed crossing.
- Ordered events for downward and upward strums.
- No key-repeat retrigger.
- No stuck armed state.
- Muted visual interaction remains coherent.

### Commit 07.5 - add accessible and touch alternatives

Proposed message:

```text
feat: make guitar accessible across inputs
```

Scope:

- Accessible mute button and status labels.
- Focusable string controls; focused string plus `F` triggers a note.
- Touch press-and-hold Play control.
- Pointer modality-specific instructions.
- Polite audio error live region.
- Armed state conveyed by text/shape as well as color.

Checks:

- Full keyboard walkthrough.
- Touch emulation/manual mobile test.
- Axe scan.
- VoiceOver/NVDA-oriented semantic inspection where available.
- Focus indicators in both themes.

### Commit 07.6 - integrate, document, and performance-test the widget

Proposed message:

```text
test: cover guitar integration and performance
```

Scope:

- Homepage hero integration replacing the static six-string placeholder; the lower jazz section only links back to it.
- `/lab` guitar states.
- E2E interaction suite.
- Bundle and animation-frame performance checks.
- Developer documentation for tuning, physics, and interaction invariants.

Checks:

- Homepage initial JS budget before Tone loads.
- Tone lazy chunk verification.
- No layout shift on activation.
- First-viewport placement at supported desktop widths and immediate discoverability on narrow screens.
- Route away/back does not duplicate listeners or audio nodes.
- Manual Safari/iOS audio test noted if not available locally.

### Branch acceptance criteria

- Desktop notes occur only after unmute and during an `F`-armed crossing.
- Multi-string gestures schedule in geometric order.
- Standard tuning is correct.
- Tone.js is lazy.
- Animation and audio resources are cleaned up.
- Mobile, keyboard, muted, error, and reduced-motion states work.
- Exactly one guitar island is mounted on the homepage, in the hero.
- Unit and E2E suites cover core failure modes.

## 13. Stage 08 - Command palette and search

### Branch

`codex/feat/command-search`

### Goal

Add a lightweight command palette that searches static routes, projects, headings, and published article metadata without introducing a search service.

### Commit 08.1 - generate a static search index

Proposed message:

```text
feat: generate static site search data
```

Scope:

- Build-time index from routes, projects, and published articles.
- Title, description, tags, and URL only initially.
- Draft exclusion.
- Deterministic sorting and lightweight normalization.

Checks:

- Snapshot/index tests.
- No email or private metadata.
- Index size review.
- Draft absence.

### Commit 08.2 - add the command palette island

Proposed message:

```text
feat: add command palette search
```

Scope:

- shadcn Command/Dialog-based island.
- `Cmd/Ctrl + K` shortcut.
- Navigation commands, theme commands, and content search.
- Clear empty state.
- Restore focus after close.

Checks:

- Keyboard open/search/select/close flow.
- Mobile menu integration.
- Screen-reader names and focus trap.
- Shortcut ignored in editable controls.

### Commit 08.3 - integrate navigation and search tests

Proposed message:

```text
test: cover command search flows
```

Scope:

- Header integration.
- E2E coverage for routes, articles, projects, empty query, theme change, and focus restoration.
- Bundle review.

### Branch acceptance criteria

- Search is entirely static and private-data-free.
- Drafts are never indexed.
- Keyboard and mobile behavior are accessible.
- No external search dependency or runtime API exists.

## 14. Stage 09 - Cloudflare production, privacy, and security

### Branch

`codex/feat/cloudflare-production`

### Goal

Make the static application safely deployable to Cloudflare with protected contact data, explicit crawler policy, cache/security headers, and reviewable GitHub Actions.

### Commit 09.1 - configure Workers Static Assets

Proposed message:

```text
feat: configure Cloudflare static deployment
```

Scope:

- `wrangler.jsonc` pointing at `dist/`.
- Static 404 behavior, not SPA fallback.
- Compatibility date and reviewed config.
- Local Wrangler preview script.
- No Astro Cloudflare SSR adapter.

Checks:

- Production build.
- Wrangler dry-run or preview.
- Direct routes, assets, 404, RSS, and sitemap.
- Confirm no runtime bindings.

### Commit 09.2 - add environment-backed contact rendering

Proposed message:

```text
feat: add private contact configuration
```

Scope:

- Validated build-time environment schema.
- `SITE_EMAIL_BROWN` and `SITE_EMAIL_PERSONAL`.
- Accessible mail and copy controls.
- `.env.example` with placeholders only.
- Missing-variable behavior that fails production builds clearly.

Checks:

- Build succeeds with temporary non-sensitive fixture values.
- Production mode fails when required values are missing.
- Repository and build logs contain no real address.
- Emails absent from JSON-LD, RSS, search index, and other machine-readable artifacts.

### Commit 09.3 - add security and caching headers

Proposed message:

```text
feat: add production security headers
```

Scope:

- CSP compatible with local assets and Cloudflare email decoding.
- Referrer, content-type, frame, opener, permissions, and cache policy.
- Immutable hashed assets and appropriate HTML/feed revalidation.
- No broad wildcard origins or `unsafe-eval`.

Checks:

- Local/static header behavior where supported.
- Deployed-preview header inspection before branch merge if a safe preview is available.
- Theme, Tone.js, Anime.js, Mermaid, and email decode compatibility.

### Commit 09.4 - finalize crawler and bot policy

Proposed message:

```text
feat: define crawler and abuse policy
```

Scope:

- Final `robots.txt`.
- Documentation for enabling Email Address Obfuscation.
- Documentation and explicit decision point for Block AI Bots.
- Future Turnstile/rate-limit runbook.
- Clarify that visible emails cannot be made unreadable to all capable bots.

Checks:

- Search and preview bots remain allowed.
- Sitemap declaration is correct.
- No contradictory `noindex` metadata.

### Commit 09.5 - add GitHub deployment workflows

Proposed message:

```text
ci: deploy reviewed builds to Cloudflare
```

Scope:

- Pull-request preview workflow if Cloudflare credentials and preview lifecycle are approved.
- Main-branch production workflow.
- Minimal GitHub permissions.
- Environment protection for production.
- Secret names documented without values.
- Post-deploy smoke script for routes, headers, and email obfuscation.

Safety:

- Workflow creation does not itself authorize a production deploy.
- Do not add or transmit credentials without explicit user authorization.
- Do not push or activate the workflow until reviewed.

Checks:

- Workflow syntax.
- Local build equivalence.
- Secret scan.
- Dry-run/post-deploy script against a non-production fixture when possible.

### Commit 09.6 - document Cloudflare previews and deployment

Proposed message:

```text
docs: add Cloudflare deployment guide
```

Scope:

- Create `DEPLOYMENT.md` covering prerequisites, Wrangler authentication, local `pnpm cf:preview`, preview deployments, protected production deployments, required GitHub/Cloudflare secrets, custom-domain setup, headers, email-obfuscation settings, crawler/bot settings, logs, post-deploy checks, and rollback.
- Add the now-functional `cf:preview` command to the README command summary.
- Link `DEPLOYMENT.md` from `README.md` and `DEVELOPMENT.md`.
- Clearly label commands that mutate remote state and require explicit authorization.
- Use placeholder account/project/domain values only.

Checks:

- Run every non-mutating documented command.
- Verify local Cloudflare preview from a clean build.
- Verify all referenced scripts and files exist.
- Verify no credential, account ID, email address, or production hostname is committed unintentionally.

### Branch acceptance criteria

- Static assets deploy without SSR or unused bindings.
- Real contact values are absent from Git.
- Cloudflare-served raw HTML obfuscation is externally verified before launch.
- Security headers do not break site features.
- Crawler policy is selective, not a blanket private-site wall.
- Production deployment requires protected GitHub environment approval.
- `DEPLOYMENT.md` lets the user preview, deploy, inspect, and roll back without undocumented steps.

## 15. Stage 10 - Quality and launch hardening

### Branch

`codex/chore/launch-hardening`

### Goal

Turn feature completeness into launch readiness through accessibility, performance, cross-browser, observability, and release checks.

### Commit 10.1 - expand accessibility automation

Proposed message:

```text
test: enforce accessibility checks
```

Scope:

- Axe checks for representative routes.
- Keyboard journey tests.
- Reduced-motion tests.
- High-contrast/focus regressions where practical.
- Accessibility checklist documentation.

### Commit 10.2 - enforce performance budgets

Proposed message:

```text
test: enforce web performance budgets
```

Scope:

- Bundle inspection/reporting.
- Lighthouse CI or equivalent budget checks after baseline measurement.
- Guardrails for lazy Tone.js and Mermaid.
- Font and image layout-shift checks.

Do not choose arbitrary failing thresholds. Measure the approved implementation, set meaningful budgets, and explain their maintenance cost before committing.

### Commit 10.3 - add deployment diagnostics and source-map policy

Proposed message:

```text
chore: add production diagnostics
```

Scope:

- Build identifier in footer and logs.
- Cloudflare observability configuration where applicable.
- Source-map generation/upload policy.
- Client error boundary logging without private content.
- Sentry remains excluded unless separately approved based on demonstrated need.

### Commit 10.4 - complete release documentation

Proposed message:

```text
docs: add launch and maintenance runbooks
```

Scope:

- Audit and reconcile `README.md`, `DEVELOPMENT.md`, `CONTENT.md`, and `DEPLOYMENT.md` against the implemented commands and workflows.
- Add release and maintenance checklists without duplicating the detailed guides.
- Dependency updates.
- Cloudflare settings checklist.
- Contact-secret rotation.
- Browser/audio regression checklist.
- Automated internal-link and external-link validation where it is reliable and does not make local development network-dependent.

Checks:

- Execute every documented local command from a clean checkout.
- Run documentation formatting and link checks.
- Confirm no guide references a deferred or removed script as currently available.
- Perform a dry-run of the rollback and secret-rotation instructions without changing production state.

### Branch acceptance criteria

- All required CI checks pass.
- Representative pages pass accessibility review.
- Performance budgets are measured and documented.
- No critical browser console errors.
- Launch/rollback does not depend on undocumented knowledge.
- User-facing developer, content, and deployment guides agree with `AGENTS.md`.
- Sentry is either deliberately deferred or introduced on its own approved branch.

## 16. Stage 11 - Deferred portrait and content polish

### Branch

`codex/feat/portrait-content-polish`

### Start condition

Do not start until the user supplies the photograph and any missing canonical project/content URLs.

### Candidate commits

#### Commit 11.1 - add the approved portrait

```text
feat: add homepage portrait
```

- Optimize source image into responsive formats.
- Define focal point and art direction.
- Add accurate alt text.
- Maintain no-layout-shift dimensions.
- Verify light/dark framing.

#### Commit 11.2 - finalize public project links and content

```text
content: finalize research and project links
```

- Add canonical Tundra URL when supplied.
- Replace fixture articles/projects with public content.
- Verify affiliations and outbound links.

#### Commit 11.3 - add final social preview assets

```text
feat: add social preview artwork
```

- Original OG image design using site tokens.
- No raw emails.
- Verify crops on common social-card dimensions.

### Branch acceptance criteria

- Photograph is user-supplied and correctly attributed/owned.
- No fabricated likeness or unapproved personal data.
- Canonical links resolve.
- Final screenshots and content receive explicit branch approval.

## 17. Optional future branches

These are not part of v1 and require a new decision before planning commits.

### Sentry

Potential branch: `codex/feat/sentry-observability`

Start only if public interactive errors justify it. Require a privacy and source-map review first.

### Contact form

Potential branch: `codex/feat/contact-form`

Would require:

- Narrow server endpoint.
- Zod validation.
- Turnstile server verification.
- Route-specific rate limit.
- Delivery provider and privacy decision.
- Accessible non-JavaScript response.

### Large media library

Potential branch: `codex/feat/r2-media`

Start only when repository-hosted media becomes materially burdensome. Define cache, CORS, asset naming, lifecycle, and cost policy first.

### Real-time collaborative music

Potential branch: `codex/feat/collaborative-guitar`

Would likely use Durable Objects, but it is intentionally outside the personal-site v1 scope.

## 18. GitHub repository configuration

After the governance branch merges and the remote exists:

1. Push `main` and set it as the default branch.
2. Require pull requests before merging.
3. Require the CI job names introduced in Stage 01.
4. Require branches to be up to date if that does not create unnecessary churn for a single-developer repository.
5. Disable force pushes and branch deletion on `main`.
6. Enable **Rebase and merge** and disable merge commits and squash merging.
7. Add production environment protection before Stage 09 deployment workflows.
8. Store Cloudflare and contact values in environment-scoped GitHub secrets.
9. Keep pull requests small enough to review commit by commit.

Recommended pull-request title format:

```text
<type>: <feature outcome>
```

Required merge policy:

- Use **Rebase and merge** for every feature branch.
- Preserve the reviewed commit boundaries; do not squash or create feature merge commits.
- Obtain explicit authorization for the merge after the branch review, even though the method is predetermined.

## 19. Cross-branch invariants

Every branch must preserve these properties:

- `main` was releasable before the branch and remains releasable after merge.
- Static content works without JavaScript.
- Client JavaScript is attached only to explicit islands or small scripts.
- No raw contact emails or secrets enter Git history.
- No résumé PDF is published without privacy review.
- Draft posts do not enter indexes, feeds, sitemaps, metadata, or search.
- Both themes remain functional.
- Reduced-motion behavior remains functional.
- No feature adds SSR, a database, or a Cloudflare binding without an approved architecture change.
- No substantial Chanhdai code is copied without notice review; no protected branding is copied at all.
- Tests accompany behavior at the same commit boundary where practical.
- Documentation changes with the behavior it describes.

## 20. Definition of a reviewable branch

A feature branch is ready for branch review when:

1. All planned commit candidates are approved and committed.
2. No uncommitted feature work remains.
3. Branch-level format, lint, type, unit, build, and relevant E2E checks pass.
4. Visual work has current screenshots in both themes and representative widths.
5. The branch diff against `main` contains no unrelated work.
6. Acceptance criteria are checked line by line.
7. Known limitations and deferred work are documented.
8. The user receives a complete code and architecture walkthrough.
9. The user explicitly authorizes the PR, push, and merge actions that should occur.

## 21. Governance-to-foundation handoff

Do not scaffold code until the governance branch is reviewed and merged.

After Commit 00.2 is approved and committed:

1. Check the Stage 00 branch acceptance criteria against the complete branch diff.
2. Present the governance branch review and wait for explicit merge, push, or pull-request authorization.
3. After merge authorization, use the required rebase workflow and update local `main` to the reviewed result.
4. Create `codex/chore/foundation` from that updated `main`.
5. Prepare Commit 01.1 and return to the per-commit approval gate.
