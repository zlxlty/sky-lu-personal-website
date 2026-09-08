# Sky Lu Personal Website - Implementation Roadmap

Status: Stage 02 design system in final branch review
Last updated: 2026-08-27
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
| 07 | `codex/feat/guitar-widget` | Six playable sampled strings as the homepage hero visual | 06 |
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
| 02 | Implementation complete; final branch review pending | Commits 02.1 through 02.9 are pushed on `codex/feat/design-system`. Quality and Browser CI passed through `b10e04d` in [run 33096704296](https://github.com/zlxlty/sky-lu-personal-website/actions/runs/33096704296). The branch-tip audit candidate below resolves the final code and documentation findings before rebase-merge authorization. |
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
| 02.8 annotation stack isolation | Committed and pushed; CI passed | `099b11e` on `origin/codex/feat/design-system`; [Quality and Browser CI](https://github.com/zlxlty/sky-lu-personal-website/actions/runs/33095846464) passed. |
| 02.9 completion documentation | Committed and pushed; CI passed | `b10e04d` on `origin/codex/feat/design-system`; [Quality and Browser CI](https://github.com/zlxlty/sky-lu-personal-website/actions/runs/33096704296) passed. |
| 02.10 final branch audit | Branch-tip audit | The commit containing this row keeps destructive hover content on its tested emphasis pair and synchronizes the plan with the implemented palette. |

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
- Document responsive visibility and Tailwind-first optical positioning for
  rail annotations.
- Capture accepted maintainability follow-ups without expanding Stage 02.

### Commit 02.10 - close final design-system review gaps

Proposed message:

```text
fix: close design system review gaps
```

Scope:

- Keep destructive-button hover content on the accessible danger-emphasis pair
  instead of exposing danger text against an arbitrary host surface.
- Add a component-contract regression for the destructive hover classes.
- Synchronize the approved dark raised-surface value and final Stage 02 ledger
  with the implemented branch.

Checks:

- Focused unit tests for design tokens and UI primitives.
- Full repository verification and browser suite before merge review.

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

### Deferred review notes

- Theme-color metadata currently repeats the two paper-color literals from the
  CSS token source. Consolidate them only when deployment metadata or additional
  themes make a build-time palette source worthwhile.
- `LabControls` deliberately keeps all interactive specimens inside one hydrated
  development island. Split specimen groups into local child modules if later
  stages make that file materially harder to review; do not create one island
  per primitive.

### Supplemental UI review - accessible overlay behavior

Branch: `codex/fix/ui-maintainability`, based on reviewed `main` at `046b5d1`
in a separate worktree. This is a corrective follow-up to Stage 02, not the start
of a later feature stage.

Commit approved and created locally as `1227b5b`:

```text
fix: keep shared overlays accessible on small screens
```

Scope:

- Constrain Dialog and all Sheet directions to the viewport, with internal
  scrolling and space between header text and the optional close button.
- Compose CommandDialog from the existing Dialog and cmdk menu so modal focus,
  labeling, and viewport behavior have one implementation to maintain.
- Keep the command input visible while a constrained results list scrolls.
- Replace the command input's rectangular outline with a focus line along its
  row, as requested in design review; verify light, dark, and forced-colors modes.
- Reserve focus-outline clearance when Dialog and Sheet scroll to footer actions.
- Document the composition and focus API and add browser regressions for short
  screens, keyboard dismissal, selection, focus restoration, and accessibility.

Non-goals:

- No homepage redesign, new routes, search feature, dependency changes, or new
  production islands. Content-model changes remain owned by their feature branch.

Checks:

- Reproduce short-screen clipping and command focus loss before the fix.
- Run the focused overlay browser tests, `pnpm verify:full`, and `pnpm test:lab`.
- Inspect light/dark, mobile/desktop, keyboard, and reduced-motion states; keep
  review screenshots outside tracked source.

### Supplemental DX review - reliable browser verification

Continue on `codex/fix/ui-maintainability` in the same separate worktree after
the approved overlay commit. This candidate improves the Stage 01 development
workflow and does not start a dependent product stage.

Commit approved and created locally as `eaf2fea`:

```text
chore: isolate browser verification across worktrees
```

Scope:

- Give each browser suite a dedicated server with validated port overrides and
  refuse to reuse an unrelated server. Keep server commands and browser URLs
  together in one test-support module, with an explicit environment for each suite.
- Run the lab alongside the developer's interactive Astro server without changing
  its CLI lock or Vite optimization cache.
- Separate production and lab failure artifacts so one suite does not erase the
  other's results or downloaded CI traces.
- Include the portable lab suite in `verify:full` to match CI's required checks.
- Document the worktree workflow, port conflicts, and test configuration ownership.

Non-goals:

- No production source changes, new dependencies, new test framework, or changes
  to the content branch. Simultaneous builds in one checkout remain unsupported.

Checks:

- Unit-test default and overridden ports and rejection of invalid values.
- Exercise both suites with overridden ports and confirm occupied ports fail.
- Run `pnpm verify:full`, `pnpm test:lab`, and the portable lab command in CI mode.
- Confirm the interactive dev server survives test startup and teardown, and that
  test servers release their ports.

### Supplemental DX review - worktree-aware hook installation

Continue on `codex/fix/ui-maintainability` after the approved browser-tooling
commit. This is one corrective candidate for the existing Stage 01 hook workflow.

Committed as `3e30ecc` after explicit approval:

```text
fix: install git hooks correctly in linked worktrees
```

Scope:

- Keep simple-git-hooks 2.13.1 and the existing pre-commit command. Apply a small
  pnpm patch so Git resolves its effective hook directory and the CLI reports
  installation errors with a failing exit status.
- Preserve hooks not managed by the project through the existing package option.
- Test the installed CLI with real disposable repositories and linked worktrees,
  including custom hook paths, unrelated hooks, and failure/skip behavior.
- Document hook discovery, the patch's purpose and removal criteria, and the Git
  version required to exercise hooks directly in tests.

Checks:

- Reproduce the six failing regression cases before applying the patch.
- Run the focused hook tests and `pnpm verify`.
- Run `pnpm run prepare` in this worktree; compare existing hook contents before
  and after and confirm they remain unchanged.
- Verify a fresh frozen-lockfile install applies the patch and installs the hook.
- Confirm no dependency versions, unrelated files, or hook commands change.

### Supplemental maintainability review - shared browser theme control

Continue on `codex/fix/ui-maintainability` after the approved hook-installation
commit. This candidate makes the existing theme behavior reusable by feature
handlers while preserving the static shell and synchronous first-paint bootstrap.

Committed as `22ba8f4` after explicit approval:

```text
refactor: share theme control across browser features
```

Scope:

- Move the header's browser behavior into one page-scoped module with
  `initializeTheme()` and `toggleTheme()` entry points; keep imports safe during
  static rendering and avoid a React provider or new dependency.
- Connect the lab's existing theme command to the shared behavior without
  finding or clicking the header. The global production palette stays in Stage 08.
- Handle local-storage clear events and ignore session-storage events; preserve
  in-page theme switching when storage access or writes fail.
- Document theme ownership and extend real-browser regression coverage for
  multiple tabs, blocked storage, and the command/header integration.

Checks:

- Reproduce the two storage failures and inactive lab command before changing code.
- Run focused theme and command browser tests, then `pnpm verify:full`.
- Run the lab's existing visual targets without updating snapshots; inspect
  light/dark desktop/mobile states and keyboard behavior.
- Confirm the production shell retains its no-JavaScript fallback, pre-paint
  bootstrap ordering, and lack of React hydration.

### Supplemental blueprint review - composable border ownership

Continue on `codex/fix/ui-maintainability` after the approved theme-controller
commit. The user clarified that compositions are vertical stacks, including nesting.

Committed as `1fe45b0`: `fix: make blueprint borders compose across nested stacks`.

Scope:

- Put the header and main content inside one viewport-height blueprint frame
  that owns the two vertical rails. Remove vertical borders from nested panels,
  the header, and horizontal dividers.
- Let stacks own their outer horizontal rules and later flow sections own joins.
  Ignore overlays, hidden elements, non-layout nodes, and empty panels when
  identifying sections. Keep rules visible above opaque surfaces and mask
  scrolling stripes behind the sticky header across the viewport.
- Soften blueprint rails, rules, and hatching to 12% ink opacity in both themes
  through one semantic token, including the no-JavaScript system-theme fallback.
- Exercise adjacent panels, all nine panel/band/stripe pairs, leading/trailing
  dividers, nested stacks, descriptions, and decorative overlays in static
  development-only lab routes.
- Replace the old exact-coordinate overlap check with a shared seam inspector
  that also detects adjacent-pixel double lines, missing rules, and incomplete
  full-width rules. Add screenshot-pixel and full-height rail checks.
- Document the new ownership and composition contract, retain attribution, and
  review affected visual baselines before updating them.

Checks:

- Reproduce six composition/rail failures, the opaque-background pixel failure,
  and scrolling stripes leaking through the sticky-header gutters in both themes
  before their fixes.
- Verify the composition matrix without JavaScript at 360, 768, 1024, and 1440px
  in both themes; check accessibility and shared rule geometry in production.
- Run `pnpm verify:full` and the reviewed lab visual targets.
- Manually inspect desktop/mobile layouts, keyboard focus, scrolling, annotations,
  and the continuous rails; preserve review screenshots outside tracked source.
- Confirm no new dependency, hydration, production lab route, or unrelated change.

### Current content implementation - writing and project pages

The user superseded the diverging content branch on September 6, 2026 and
requested an independent implementation on the current review branch. Do not
merge or copy that branch. This candidate supplies the small collection boundary
needed by the pages it renders, replacing the unexecuted route work below for
this branch. Profile data, homepage composition, SEO, and feeds remain separate work.

Proposed message: `feat: add writing and project publishing pages`.

- Build static `/writing`, `/writing/[slug]`, `/projects`, and
  `/projects/[slug]` using the current blueprint stack and 12% border token.
- Keep route metadata in strict content schemas and narrative in Markdown/MDX.
  Centralize published-entry selection; exclude drafts from public paths.
- Author four concise project summaries from the supplied résumé. Keep the
  résumé private and do not invent external project links or published articles.
- Provide an honest writing empty state, a populated development preview, and a
  reusable article layout with a draft specimen for prose, code, tables, and TOC.
- Adapt the MIT-licensed reference Line Nav into a static, accessible component
  with CSS focus/hover feedback, preserving source attribution.
- Add working global navigation and a branded 404 for the new route surface.
- End main title blocks with `StripeSeparator` then `PanelRuleBand` across indexes,
  readers, the homepage, and visible lab page headings; verify their shared joins.
- Incorporate the requested sketch underline revision before approval: reusable
  text labels with seeded pen gestures, per-instance path caching, multiline
  measurement with taller strokes, hover-only CSS drawing and backward erasing,
  and native no-JavaScript/forced-color fallbacks. Verify interrupted transitions,
  resize, font/text updates, reconnection, and cleanup in the lab.
- Use Astro's programmatic static preview for browser verification so clean
  content URLs resolve to their directory indexes and missing pages return 404.
- Verify published article routes and next-entry links in an isolated build;
  exercise invalid frontmatter and draft project/article exclusion there.
- Verify schemas, ordering, draft exclusion, all local content links, responsive
  layouts, accessible headings/navigation, anchor offsets, and border ownership.
- Run `pnpm verify:full`, review light/dark mobile/desktop screenshots, and
  update only intentionally changed visual baselines before commit review.

### Supplemental DX fix - linting on a fresh checkout

The content candidate was approved, committed as `5d5cc55`, and pushed on
`codex/fix/ui-maintainability`. Its first CI run reproduced a clean-checkout
failure: ESLint ran before Astro generated the collection types, so the typed
queries appeared unsafe. Local development had already generated those types.

Proposed message: `fix: generate Astro content types before linting`.

- Run `astro sync` before both full-project lint commands and staged source lint.
- Keep generated types ignored and retain all type-aware lint rules.
- Document the generated-file prerequisite without requiring a manual build.
- Exercise the real lint scripts in isolated fixtures without an `.astro`
  directory; verify staged lint also works before any build or dev server.
- Run the focused regression checks and `pnpm verify`, then inspect the complete
  diff and obtain approval for this separate corrective commit before pushing it.

### Historical profile continuation

The UI/content branch was approved and rebase-merged through PR #3, preserving
seven commits through `b322095`. Continue from that merged base on
`codex/feat/profile-cv`, reusing the current worktree. The user clarified that new
feature branches do not each need a new worktree. Do not import the outdated
content-model branch.

The original PDF delivery was approved and committed as `22c3f06`. The user
retired this feature on September 7, 2026; commit 04.5c below removes the asset
and its delivery paths. Shared profile and experience data remain independent.

### Current candidate - typed profile and experience data

Proposed message: `feat: add typed profile and experience data`.

- Add readonly, build-time identity, education, experience, research, and public
  link records from the approved résumé and the confirmed wording in `PLAN.md`.
- Keep dates at month precision, preserve expected/completed graduation status,
  and limit experience disclosures to three bullets.
- Reference existing project collection IDs; do not duplicate their metrics or
  build a PDF generation layer. Leave private contact values out of public data.
- Connect existing navigation and page titles to the shared name, preserving
  their rendered output. Homepage layout and richer content remain separate.
- Document where humans edit each fact and how project references work.
- Verify authored date/order/disclosure constraints and resolve project references
  through the real Astro content query in an isolated production build.
- Run `pnpm verify:full` and compare production output before/after the extraction.

After this candidate is approved, the profile/CV branch is ready for branch review.
The next dependent branch is Stage 04's static homepage, starting from merged main
and reusing this worktree. Skills lists, homepage layouts, and contact handling
remain with their consuming features rather than extending this data candidate.

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

### Commit 03.3 - add writing and project routes

Proposed message:

```text
feat: add core content routes
```

Scope:

- `/writing` index.
- `/projects` index.
- `/projects/[slug]` static route.
- Shared empty and not-found states.

Non-goals:

- Rich article rendering arrives in Stage 05.
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

The profile/CV continuation landed through PR #4 at `eaf58c6`, preserving its
two approved commits. Reuse the current worktree on `codex/feat/homepage` from
that merged base. Keep the following candidates separate and individually reviewed.

### Branch

`codex/feat/homepage`

### Goal

Build the homepage content and layout. The user brought guitar visual exploration
forward after 04.1: review silent, pointer-driven designs first, then decide and
connect sound in a separate commit. Remaining Stage 07 work will be reconciled
with the selected implementation rather than repeated.

### Commit 04.1 - add site header and footer

Proposed message:

```text
feat: add responsive site navigation
```

Scope:

- Sticky header.
- Approved editorial `sky lu.` wordmark using the existing Geist font, with an
  accessible home link and no additional font or client runtime.
- Desktop and mobile navigation.
- Approved notebook footer with an editorial sign-off, metadata, attribution,
  and external links. Remove abandoned design variants and their switcher.
- Minimal vinyl/arm/cartridge drawing with a typed playlist of Sky's uploaded
  covers, served from public audio URLs. The draggable
  tonearm is clamped to 0–34°, with a keyboard alternative and hidden native audio.
  The record spins only on actual audio playback, using lazy Anime.js WAAPI.
- Vertical vinyl swipes and keyboard input on the vinyl change tracks with an eased
  exit/entrance, pause playback, and park the arm. Playlist order wraps. Source,
  title, author, and record metadata live in one module; omit publication dates.
- Five subtle record-label prints cycle by playlist position. The rail note puts
  switching before playback. Omit visible selection buttons and track counters.
- A CC0 jazz fixture enables development playback without shipping demo audio
  in production. `/lab/turntable` also accepts a browser-local audio file.
- Bottom-row Privacy link and a static `/privacy` statement reflecting the
  site's current theme storage and external-link behavior.
- Header theme control with one preference and one live announcement.
- Native back-to-top link outside the right rail on desktop, returning to the
  footer row on narrower viewports. No duplicate theme toggle in the footer.
- Header and footer outside the main landmark, sharing the blueprint frame and
  one horizontal rule at each join.
- Build date and optional validated public CI revision, evaluated at build time.
- Keep the existing public route links during this candidate. Add homepage
  section anchors with their target sections; add menu/search controls when the
  destinations and search behavior exist, without presenting inert controls.
- Skip link and anchor offsets.

Checks:

- Responsive behavior.
- Full keyboard path.
- No-JavaScript links.
- External link security attributes.
- Footer frame geometry, short/long pages, and single border ownership.
- Header theme control, one screen-reader announcement, and no-JavaScript
  back-to-top keyboard navigation at both gutter and inline placements.
- Optional build revision validation and deterministic UTC date formatting.
- Direct audio fallback without JavaScript, absence of provider requests, and
  keyboard navigation to the privacy statement.
- Audio activation, interruption, errors, native pause/end events, pointer and
  touch dragging, angle limits, keyboard focus, reduced motion, and cleanup.
- No demo audio in the production build; static fallback for an empty playlist.
- Playlist validation, next/previous wraparound, cancelled gestures, lazy media
  loading, keyboard/touch selection, stable caption height, and motion cleanup.

### Commit 04.2 - add the selected silent guitar hero

Proposed message:

```text
feat: add silent guitar visual interaction
```

Scope:

- The selected filled-hole hero at `/`, with static Astro identity copy and
  one React island for guitar behavior. Development and production match.
- Six strings and a sound hole; tilt toward the upper left, with the sixth and
  thickest string at the bottom. No guitar body, headstock, or sound controls.
- Primary pointer hold and crossing replaces the former F-key requirement.
- Shared finite-segment geometry and an idle-stopping string physics loop.
- Click/tap and keyboard plucking, single-finger strumming, reduced motion,
  and cancellation. Pressing a string plucks once; release adds no extra pluck.
- Remove the chooser, variant URL state, abandoned styles, and foundation
  placeholder. Preserve the polished responsive composition and interaction.

Checks:

- Ordered crossings, gauge order, fixed endpoints, and bounded amplitudes.
- Hover alone does nothing; release, cancellation, and unmount clean up safely.
- Mobile/desktop, both themes, static no-JavaScript content, and no audio initialization.

### Commit 04.3 - add sampled guitar audio and touch controls

Proposed message:

```text
feat: add sampled guitar audio and touch controls
```

The user selected recorded samples and approved comparing Shinyguitar's acoustic
archtop, FreePats FSS steel-string, Quartertone classical, and the University of
Iowa guitar before choosing the homepage sound.

The user subsequently selected Yamaha, refined its public controls and mobile
layout, and approved committing the accumulated implementation together. The
audition and public player share one audio engine, voicing, and asset pipeline.

Scope:

- A development-only `/lab/guitar` with library selection, explicit sound
  activation, free plucking/strumming, and an identical six-note/down/up phrase.
- Tone.js sample scheduling behind a lazy import. Load/decode each selected bank
  on demand, reuse decoded buffers while enabled, and release resources on mute.
- A minimal optional pluck callback and visual handle on the existing guitar.
  Keep audio opt-in and ship only the selected recordings on the public homepage.
- Refine pointer gestures after audition feedback: click/tap plucks on release,
  with a small movement allowance; held dragging strums without a release note.
  Preserve initial crossings and discard clicks after dragging or cancellation.
- Use the requested bass-to-treble degrees `5–1–♭3–♭7–9–11`, with E♭ as root:
  E♭m11/B♭, the standard-tuned `664664` shape. Share one voicing configuration across note
  labels and audition banks; transpose the existing samples during playback.
- Prepare only the six required pitches and their velocity layers; include
  original licenses, provenance, repeatable asset preparation, and source research.
- Disclose Quartertone's compressed-preview one-shots and Iowa's note isolation
  and subsonic filter in the audition; retain creator credit and license links.

Checks:

- Cover all velocities, tuning, take alternation, scheduling cancellation,
  per-string damping, bank changes, and cleanup independently of the browser.
- Exercise actual browser decoding/scheduling, activation, gestures, loading
  failure/retry, mute, and background cancellation without recording system audio.
- Review mobile/desktop and both themes; verify no audition assets in production.

#### Selected homepage sound and controls (included in 04.3)

The user chose C (Quartertone's Yamaha Eterna) and asked to retain the complete
lab comparison. Use one homepage guitar island with opt-in activation,
mute, loading cancellation, failure/retry, and resource cleanup. Keep identity
copy static and preserve the existing gestures. Lower the drawing slightly;
place the mute/loading icon in the top-right corner and stack note names beneath
it along the inside of the right rail, highest first. Match top and right icon
padding and place the notes slightly above the midpoint between the icon and
the first string. On mobile, anchor these
controls to the guitar below the copy and enlarge the drawing for comfortable
touch plucking and strumming. Omit the homepage volume slider.
Provide a mobile `Skip guitar` link above the touch surface that moves focus to
the next content panel without JavaScript or interference from strumming.

- Move only the chosen Yamaha bank into shared assets; lazy-load its module and
  Tone on activation. Exclude the three alternatives from production builds.
- Omit the strongest fifth Yamaha layer and distribute the remaining four across
  the MIDI velocity range. Keep its reviewed gain trim and soften the drag-speed
  audio curve independently of the visual vibration.
- Keep the lab's four choices, defaulting to C; fetch only the bank being enabled.
- Preserve per-file source/license records and give public credit on `/privacy`.
- Verify exact production asset membership, pre-activation network silence,
  actual note scheduling, cancel/retry, mute, blur/offscreen, navigation, keyboard,
  touch, responsive layout, and reduced-motion behavior.

### Commit 04.4 - add static hero and identity content

Completed through the reviewed 04.2 and 04.3 composition. The user selected the
text-and-guitar hero; no portrait placeholder or additional identity labels are
needed. Preserve its approved copy and layout in the following content work.

### Commit 04.5 - add overview, research, and selected work

Proposed message:

```text
feat: add research and selected work sections
```

Scope:

- Overview metadata.
- A concise personal introduction connecting distributed systems with learning
  category/type theory, cooking, and jazz guitar; use the existing education data.
- ATLAS Group research section.
- Nikos Vasilakis attribution.
- Dynamic Pages, efficient LLM serving, Tundra, and KVonset records.
- Project metrics and approved public claims.
- Static Astro sections using the existing blueprint panel stack; nested project
  records derive titles, descriptions, tags, and first results from published
  collection entries. Preserve the mobile guitar skip destination and exclude
  draft writing. Experience disclosures and longer jazz/writing sections follow
  as separate candidates.
- Homepage header polish: omit the repeated wordmark, fade its background with
  scroll, and extend the existing desktop guitar strings behind navigation.
  Preserve the mobile composition, readable static fallback, and reduced motion.
- Use the shared editorial wordmark for the hero title at its responsive scale.

Checks:

- Copy review against approved résumé content.
- Outbound ATLAS/team links.
- No invented research title, paper, or Tundra URL.
- Responsive presentation of long technical phrases.

### Commit 04.5a - refine the personal overview

Proposed message: `feat: refine the personal homepage overview`

- Polish the user's essay, preserve its candid tone, and transition into current
  interests. Use the selected C layout: a split introduction followed by four
  labeled blueprint rows with equal horizontal and vertical content padding.
- Add UWCCSC and X Academy links with the existing sketch underline.
- Address the pool-tooltip comment, sharing static hint behavior with the hero.
- Remove the comparison layouts, switcher, and temporary development route
  override after promoting C; the homepage remains statically generated.
- Include the user's final overview copy, labels, title sizing, and punctuation
  edits across the homepage, privacy page, and guitar lab. Retain semantic
  heading levels independently of their visual size.
- Verify responsive layout, accessible hints, keyboard dismissal, no-JavaScript
  content, and the links' draw/undraw behavior.

### Commit 04.5b - add the personal milestone timeline

Proposed message: `feat: add a horizontal personal timeline`

- Replace the overview's education summary with the user's eleven personal
  milestones, newest first, keeping their voice with minor grammar corrections.
- Add a reusable static `HorizontalTimeline.astro` and typed event data in one
  file. Date, title, and inline linked description are authored per milestone.
- Use native horizontal scrolling with a hidden scrollbar and no visible
  controls. Map vertical wheel gestures over the timeline to horizontal scrolling,
  handing back to page scrolling at the endpoints. Keep focused keyboard
  navigation and reduced-motion support without hydration or new dependencies.
- Verify mobile touch scrolling, laptop trackpad scrolling, wheel handoff,
  keyboard/link focus, endpoints, resizing, and no-JavaScript access. Include
  multiple instances and short timelines in the development lab.

### Commit 04.5c - retire the hosted résumé

Proposed message: `chore: remove the hosted resume and CV navigation`

- Remove the résumé PDF, its static redirect, and the shared navigation link.
- Remove the PDF publication workflow from the current documentation and mark
  the previous delivery candidate as retired. Public biographical content stays
  independent of the private source document.
- Replace delivery tests with regressions for missing source/build assets,
  404 responses at the retired URLs, no generated download links, and the
  remaining responsive, keyboard-accessible navigation.
- Refresh the existing lab screenshot baselines after reviewing the current
  navigation in light and dark themes at mobile and desktop widths.
- Run `pnpm verify:full` and review the smaller header in both themes. This
  candidate does not rewrite Git history or change an external deployment.

### Commit 04.5d - replace homepage research with Writings

Proposed message: `feat: introduce personal writings and tentative topics`

- Replace HomeResearch with a static HomeWritings section matching Selected Work.
- Share polished introduction and four unnumbered ideas with `/writing`.
- Rename public navigation to Writings without changing route URLs.
- Add the stripe separator and rule band after the personal timeline.
- Keep tentative ideas separate from published collection entries and preserve
  draft exclusion. Remove unused homepage research data; Tundra remains a project.
- Verify mobile/desktop, both themes, no-JavaScript content, blueprint borders,
  book-link hover, navigation, and production draft filtering with `pnpm verify:full`.
- No dependency, hydration, or audio changes.

### Commit 04.5e - arrange Selected Work in a blueprint grid

Proposed message: `feat: arrange selected work in a blueprint grid`

- Match the Writings title size and equal 16px header padding.
- Add StripeSeparator before the existing divider band.
- Add static PanelGrid and PanelGridItem primitives: two columns above `sm`,
  stacked below, with paired rules around 16px gutters and row bands.
- Omit project numbering; preserve company/category labels, text, links, tags,
  and metrics.
- Verify shared borders, responsive layout, and odd/single-item grids in both themes.

### Commit 04.5f - add contextual rail notes and align footer metadata

Proposed message: `style: add contextual rail notes and align footer metadata`

- Add the requested timeline and jazz-writing annotations using RailAnnotation.
- Align the footer's build metadata and links with consistent line/control
  heights, preserving the desktop Back to top placement outside the right rail.
- Verify annotation side and arrow placement, mobile hiding, footer alignment,
  shared border ownership, and keyboard navigation.

### Commit 04.5g - prepare and publish a Cloudflare preview

Proposed message: `feat: prepare Cloudflare static preview hosting`

- User-approved early execution of the static hosting portion of 09.1 and its
  necessary documentation, on the existing homepage branch. No stacked branch,
  main merge, production domain, or CI deployment is introduced.
- Pin Wrangler as a development tool, configure assets-only serving of `dist`,
  canonical site origin, extensionless paths, and static 404 responses.
- Move the playlist and authoring example to `audio.skylu.me`. Old root audio
  paths deliberately return 404; do not preserve them with redirects.
- Add local preview, upload dry-run, explicit preview deploy, and read-only
  delivery checks. Include baseline headers, immutable hashed-asset caching, and
  preview-host noindex. Full CSP and production crawler policy remain in Stage 09.
- Verify the build and browser suite, local Wrangler routing/headers/assets,
  missing CV/lab/old-audio routes, R2 range requests, and live preview HTML.
- Step 3 authorizes publishing this preview; committing, pushing, merging, and
  production deployment still require their own approval.

### Commit 04.5h - prepare production release controls

Proposed message: `ci: prepare protected Cloudflare production releases`

- Continue the user-approved hosting setup in the existing homepage branch.
- Add a separate production Worker and `skylu.me` custom-domain configuration.
  Explicitly select the preview environment in all existing preview commands.
- Add a production dry-run and a release command that accepts only clean,
  current remote main revisions; CI may use the exact tested detached main SHA.
- Extend CI with a production job after Quality and Browser, behind a repository
  enable flag and GitHub environment. Preserve the existing required job names.
- Document required main/environment protections and scoped deployment secrets.
  Test refusal paths, local routing, both dry-runs, and production noindex checks.
- Preparation does not activate CI, configure account protections, push, merge,
  publish production, or connect DNS. Review those actions before first launch.

### Commit 04.6 - add experience disclosures

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

### Commit 04.7 - add jazz and writing previews

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

Implement the six-string standard-tuned guitar as the homepage hero's primary interactive visual, with sampled acoustic plucks, ordered strumming, primary-pointer arming, and accessible alternatives. Visual exploration and the sound audition now begin in 04.2–04.3; deduplicate completed work when this stage is reached.

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
- Six tilted SVG strings with documented widths, thickest at the bottom.
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

### Commit 07.3 - add Tone.js sample playback

Proposed message:

```text
feat: add sampled acoustic guitar audio
```

Scope:

- Lazy Tone.js import.
- Explicit audio-context unlock.
- Standard-tuned sample voices from the library selected in 04.3.
- Shared gain and limiter.
- Gauge-specific dampening/resonance.
- Mute ramp, error state, and node disposal.

Checks:

- Tone.js absent from initial homepage bundle.
- No audio before explicit unmute.
- Six notes can overlap.
- Mute/unmute has no audible click in manual review.
- Cleanup tests using mocked Tone nodes.

### Commit 07.4 - implement pointer-armed plucking and strumming

Proposed message:

```text
feat: add armed guitar interactions
```

Scope:

- Primary-pointer down/up/cancel state machine and pointer capture.
- Pointer-local coordinate tracking.
- Single pluck and ordered strum scheduling.
- Visual velocity/direction response.
- Reset on blur, hidden tab, pointer exit, route change, and unmount.
- No global arming shortcut in editable controls.

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
- Focusable string controls; Enter or Space triggers a note.
- Single-finger touch strumming on the instrument.
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

- Desktop notes occur only after audio activation and during a held-pointer crossing.
- Multi-string gestures schedule in geometric order.
- The configured E♭m11/B♭ voicing follows the playable `664664` shape and the
  requested bass-to-treble degrees `5–1–♭3–♭7–9–11`, with E♭ as root.
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

The assets-only preview foundation is brought forward into 04.5g at the user's
request. This stage still owns the separately reviewed production target.

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
- No résumé PDF or CV download route is published.
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
