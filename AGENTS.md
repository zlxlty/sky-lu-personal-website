# AGENTS.md

This file defines the mandatory working rules for every coding agent operating in this repository.

## 1. Project purpose

Build Sky Lu's personal website and technical blog as specified in:

- `PLAN.md` - product, architecture, design, content, privacy, and quality requirements.
- `IMPLEMENTATIONS.md` - dependency-ordered feature branches, commit candidates, review gates, and merge criteria.
- `README.md` - concise user-facing project overview and quick start, once Stage 01 creates it.
- `DEVELOPMENT.md` - complete local development, testing, debugging, and preview guide, once Stage 01 creates it.
- `CONTENT.md` - MDX authoring guide, once Stage 05 creates it.
- `DEPLOYMENT.md` - Cloudflare preview, production, rollback, and secrets guide, once Stage 09 creates it.

When implementation details conflict, use this precedence:

1. The user's latest explicit instruction.
2. `AGENTS.md` workflow and safety rules.
3. `PLAN.md` product and architecture decisions.
4. `IMPLEMENTATIONS.md` sequencing and commit decomposition.
5. Existing code conventions.

Do not silently reinterpret a confirmed product decision. If a necessary change crosses an architectural boundary, explain the tradeoff and obtain approval first.

## 2. Confirmed architecture

- Astro with strict TypeScript.
- Static generation by default.
- React islands only for behavior that needs a client runtime.
- Tailwind CSS v4 first: express component-local layout and spacing with
  utilities at call sites; reserve CSS custom properties for semantic color,
  typography, motion, and sizing values rather than a parallel numeric scale.
- A small, curated subset of shadcn/ui; do not install the full registry.
- The blueprint shell is selectively migrated from MIT-licensed
  `ncdai/chanhdai.com` React modules under `src/components/blueprint/` and
  renders statically through Astro. Extend that module seam instead of creating
  parallel Astro layout primitives.
- Git-authored Markdown/MDX in Astro content collections.
- Anime.js v4 for authored motion.
- Custom `requestAnimationFrame` physics and Tone.js synthesis for the guitar.
- The playable guitar is the homepage hero's primary interactive visual; the lower jazz section provides narrative and links back rather than mounting a duplicate widget.
- Cloudflare Workers Static Assets for production hosting.
- No SSR, database, authentication, comments, reactions, view counts, or guestbook in v1.
- A development-only `/lab` replaces Storybook initially.

Keep static components in Astro when possible. A familiar React implementation is not sufficient reason to hydrate a component.

## 3. Git and branch workflow

### 3.1 Branches

- `main` must stay releasable.
- All implementation work happens on a feature branch before merging into `main`.
- The approved `.gitignore` root commit on unborn `main` was the one-time bootstrap exception; every later change follows the branch workflow.
- Use the `codex/` prefix unless the user explicitly requests another name.
- Follow the branch names in `IMPLEMENTATIONS.md`, for example `codex/chore/foundation` and `codex/feat/guitar-widget`.
- Create each dependent branch from the latest reviewed and merged `main`.
- Do not begin a dependent branch from an unmerged feature branch unless the user explicitly approves stacked branches.
- Land every feature branch with a rebase merge. On GitHub, use **Rebase and merge**; for a local-only branch, rebase it onto current `main` and then fast-forward `main` with `--ff-only`.
- Preserve the individually reviewed commits. Do not squash or create merge commits for feature branches.
- Merge authorization remains branch-specific. Do not merge into `main`, push, force-push, rewrite published history, or delete a branch without explicit user authorization.
- Never use destructive Git commands such as `git reset --hard` or `git checkout --` to discard work.
- Preserve unrelated user files and changes. In particular, do not modify `.opencode/` unless the user asks.

### 3.2 Reviewable commits

Each feature branch is divided into the commit candidates documented in `IMPLEMENTATIONS.md`.

A commit candidate must:

- Have one coherent purpose.
- Be understandable without a later commit.
- Keep the tree buildable whenever practical.
- Include tests with the behavior they introduce or change.
- Avoid drive-by refactors and unrelated formatting.
- Avoid mixing dependency installation, broad mechanical formatting, and feature logic unless they are inseparable.

If actual implementation reveals that a planned commit is too broad, split it and update `IMPLEMENTATIONS.md` before asking for commit approval. If two planned commits become inseparable, explain why and ask before combining them.

## 4. Mandatory pre-commit approval gate

**Never create a commit without the user's explicit approval for that exact commit candidate.**

Do not treat approval of the feature, branch, plan, previous commit, or pull request as approval of a later commit.

Before every commit:

1. Finish only the intended commit candidate in the working tree.
2. Run the proportionate verification described in `IMPLEMENTATIONS.md`.
3. Inspect the complete diff and check for unrelated changes, secrets, generated artifacts, and accidental dependency churn.
4. Present a pre-commit review package to the user.
5. Stop and wait for explicit approval.
6. Only after approval, stage the reviewed files and create the commit using the proposed message or the user's replacement.

The pre-commit review package must include:

### A. Intent

- What the commit changes.
- What it intentionally does not change.

### B. Architectural fit

- Where the change sits in the Astro/static/islands architecture.
- Which later features depend on it.
- Any new dependency, runtime cost, or public API introduced.

### C. How it works

- The execution or data flow in plain language.
- Important state transitions, boundaries, or failure behavior.

### D. Code walkthrough

- A file-by-file walkthrough with clickable paths and useful line references.
- Important types, functions, components, configuration, and tests.
- Call out non-obvious decisions and rejected alternatives when relevant.

### E. Verification

- Exact checks run and whether they passed.
- Checks not run and why.
- Manual behavior verified, including relevant light/dark, responsive, accessibility, or no-JavaScript states.

### F. Diff and risk summary

- Changed files and concise diff statistics.
- Known limitations, follow-up work, migrations, or rollback considerations.
- Confirmation that no secret or raw email address is present.

### G. Proposed commit

- Exact proposed commit message.
- Explicit question: **"Approve this commit?"**

Do not stage or commit while waiting for the review response. Read-only Git inspection is allowed.

If the user requests changes:

- Make the requested changes.
- Re-run relevant verification.
- Present a new complete pre-commit review package.
- Do not rely on the previous approval request.

If the working tree changes after approval but before the commit, stop and re-present the updated diff unless the change is a deterministic generated file already described in the approved package.

After an approved commit:

- Report the commit hash and message.
- Report the remaining branch plan.
- Do not automatically start, stage, or commit the next candidate if the user asked to review progress one commit at a time.

## 5. Branch completion and merge gate

Before asking to merge a feature branch:

1. Confirm every planned commit was individually approved.
2. Run the branch-level test suite and production build.
3. Review the branch diff against `main`.
4. Check acceptance criteria from `IMPLEMENTATIONS.md` and relevant requirements from `PLAN.md`.
5. Present a branch review containing:
   - Feature outcome.
   - Commit list.
   - Architecture walkthrough.
   - User-visible behavior.
   - Tests and quality results.
   - Screenshots for visual work.
   - Known limitations and deferred items.
   - Rebase readiness and any expected conflicts.
6. Wait for explicit permission before merging or opening/pushing a pull request.

Prefer a normal pull request review on GitHub and select **Rebase and merge**. If rebasing produces a conflict or changes the reviewed tree, resolve it through the normal approval workflow, rerun affected checks, and present the updated branch diff before merging.

## 6. Implementation discipline

- Read the relevant section of `PLAN.md` and `IMPLEMENTATIONS.md` before changing code.
- Inspect existing code before adding abstractions or dependencies.
- Use `rg` and `rg --files` for repository search.
- Use `apply_patch` for manual file edits.
- Use pnpm and commit `pnpm-lock.yaml` changes only when dependencies intentionally change.
- Maintain strict types; avoid `any`, unsafe assertions, and broad suppression comments.
- Keep browser-only APIs behind client boundaries.
- Keep per-frame guitar state outside React render state.
- Do not introduce SSR or a Cloudflare binding for convenience.
- Do not add analytics, Sentry, Storybook, a CMS, or backend storage before its planned gate.
- Do not copy personal data, logos, wordmarks, or distinctive brand assets from chanhdai.com.
- Preserve per-file attribution and `THIRD_PARTY_NOTICES.md` for substantial
  source migrated from chanhdai.com.

## 7. Privacy and secrets

- Never commit the Brown or personal email address in source, fixtures, snapshots, generated metadata, or documentation.
- Refer to them as `SITE_EMAIL_BROWN` and `SITE_EMAIL_PERSONAL`.
- Real values belong in ignored `.env.local` files and GitHub/Cloudflare secrets.
- Do not place emails in JSON-LD, RSS, `llms.txt`, OG metadata, or JSON endpoints.
- Never log secrets, email addresses, Turnstile tokens, or form content.
- Before every commit, search the diff and working tree for likely secrets and raw email addresses.
- Do not publish the provided résumé PDF without an explicit privacy review; it contains extractable contact information.

## 8. Developer tools and local workflows

This section defines the command-line interface developers and agents should be able to rely on after Stage 01. If a planned script does not exist yet, do not pretend it ran; implement it in the documented foundation commit or clearly report that the repository is still pre-scaffold.

### 8.1 Runtime and package manager

- Use the Node.js version pinned by `.nvmrc` and `package.json#engines`.
- Use the pnpm version pinned by `package.json#packageManager`.
- Do not use npm, Yarn, or Bun to modify dependencies or the lockfile.
- With `nvm`, run `nvm use`. With `fnm`, run `fnm use`.
- Enable Corepack when the pinned pnpm is unavailable: `corepack enable`.
- For the first local install, run `pnpm install`.
- In CI or when verifying lockfile reproducibility, run `pnpm install --frozen-lockfile`.
- Commit `pnpm-lock.yaml` whenever an approved dependency change updates it.
- Explain every new runtime dependency and its client/server bundle impact in the pre-commit review.

### 8.2 Expected script contract

These scripts form the stable lifecycle contract. Stage 01 provides all of them except `cf:preview`, which Stage 09 adds with Wrangler. Later commits may extend the contract but must not silently change an existing command's meaning.

| Command | Use |
| --- | --- |
| `pnpm dev` | Start Astro's development server with hot module replacement. |
| `pnpm build` | Produce the production static build in `dist/`. |
| `pnpm preview` | Serve the Astro production build locally for framework-level verification. |
| `pnpm cf:preview` | Build and serve the site through the local Cloudflare/Wrangler runtime once Stage 09 adds it. |
| `pnpm check` | Run `astro check`, TypeScript checks, and content type validation. |
| `pnpm format` | Apply Prettier to supported source and documentation files. |
| `pnpm format:check` | Verify formatting without writing files. |
| `pnpm lint` | Run ESLint without modifying files. |
| `pnpm lint:fix` | Apply safe ESLint fixes; always inspect the resulting diff. |
| `pnpm test` | Run Vitest once in deterministic CI mode. |
| `pnpm test:watch` | Run related Vitest tests continuously during development. |
| `pnpm test:coverage` | Produce unit-test coverage after meaningful application logic exists. |
| `pnpm test:e2e` | Run Playwright against a production-style local server. |
| `pnpm test:e2e:ui` | Open Playwright's local UI for debugging tests. |
| `pnpm test:e2e:update` | Update reviewed visual snapshots; never run blindly. |
| `pnpm verify` | Run formatting, linting, type/content checks, unit tests, and the production build. |
| `pnpm verify:full` | Run `pnpm verify` plus the complete Playwright suite. |

Deployment scripts must be explicit about their target. Never make `pnpm build`, `pnpm preview`, `pnpm verify`, or an install hook deploy anything.

### 8.3 First-time setup

Once the foundation branch is merged, a developer should be able to run:

```bash
nvm use
corepack enable
pnpm install
pnpm exec playwright install
cp .env.example .env.local
pnpm dev
```

Use the platform-appropriate Node version manager if `nvm` is unavailable. Do not put real email values in `.env.example`; set them only in the ignored `.env.local` when the contact feature reaches Stage 09.

The application should print a local URL. Visit `/` for the site and `/lab` for component states while the lab is available in development.

### 8.4 Normal development loop

1. Update local `main` without rewriting user work.
2. Create the planned `codex/...` branch.
3. Run `pnpm install --frozen-lockfile` when `package.json` or the lockfile changed.
4. Start `pnpm dev`.
5. Use `pnpm test:watch` for pure logic such as guitar geometry and content utilities.
6. Use `/lab` for component states, themes, responsive behavior, motion, and the guitar.
7. Before presenting a commit, run the smallest relevant checks followed by `pnpm verify`; use `pnpm verify:full` for browser-facing changes.
8. Inspect the full Git diff and present the mandatory review package.

Use `pnpm preview` before reviewing production-only behavior such as static route output, asset URLs, hydration, and draft filtering. Use `pnpm cf:preview` for Cloudflare-specific headers, routing, bindings, or runtime behavior after it exists.

### 8.5 Which test tool to use

| Tool | Appropriate for |
| --- | --- |
| Vitest | Pure TypeScript, schemas, content filtering, geometry, scheduling, state reducers, and utilities. |
| Playwright | Navigation, hydration, keyboard/pointer/touch behavior, theme persistence, audio activation calls, MDX rendering, responsive layout, and production routing. |
| Axe through Playwright | Automated accessibility regressions on representative pages and component states. |
| `/lab` | Manual visual development of isolated states without Storybook. |
| Astro production preview | Final generated HTML, assets, routes, RSS, sitemap, and no-JavaScript behavior. |
| Wrangler preview | Cloudflare routing, static assets, headers, and deployment-sensitive behavior. |

Do not test Web Audio by recording microphone/system output. Unit-test audio scheduling and node lifecycle with mocks, then manually verify audible behavior in supported browsers.

### 8.6 Debugging

- Start with Astro's development overlay and browser console.
- Reproduce production-only issues with `pnpm build && pnpm preview`.
- Reproduce Cloudflare-only issues with `pnpm cf:preview` after Stage 09.
- Use browser performance tools to inspect layout shifts, long tasks, animation frames, and loaded chunks.
- Confirm Tone.js and Mermaid are absent from pages that do not use them.
- Check hydration warnings and uncaught errors after every client-island change.
- For failing Vitest tests, use `pnpm test:watch` and target the relevant file through pnpm argument forwarding.
- For failing Playwright tests, use `pnpm test:e2e:ui`; retain traces/screenshots only for failures or reviewed visual baselines.
- Use Cloudflare real-time logs only for deployed Worker behavior, and never print contact values or secrets.

### 8.7 Formatting, linting, and hooks

- Prettier owns mechanical formatting.
- ESLint owns code-quality rules and unsafe patterns.
- `astro check` and TypeScript own type correctness.
- Do not hand-format around the formatter or mix repository-wide formatting into a feature commit.
- The planned pre-commit hook may run lint-staged formatting/linting only on approved staged files.
- A hook never replaces `pnpm verify`, CI, or the user approval gate.
- Do not bypass hooks with `--no-verify` unless the user approves a documented emergency, and report it immediately.

### 8.8 Editor support

Stage 01 should add optional VS Code recommendations for:

- Astro language support.
- ESLint.
- Prettier.
- Tailwind CSS IntelliSense.
- MDX.
- Playwright Test.

Editor settings should prefer repository-local formatters, format supported files consistently, and avoid rewriting unrelated files on save. The command-line scripts and CI remain authoritative; no contributor should be required to use VS Code.

### 8.9 Documentation ownership

- `README.md` stays short: project purpose, prerequisites, quick start, and links to deeper guides.
- `DEVELOPMENT.md` explains installation, commands, environment variables, architecture boundaries, tests, `/lab`, debugging, and CI parity.
- `CONTENT.md` explains blog/project frontmatter, drafts, MDX components, code, math, Mermaid, figures, and authoring checks.
- `DEPLOYMENT.md` explains Cloudflare configuration, GitHub environments/secrets, previews, production deploy, email-obfuscation verification, logs, and rollback.
- Update the closest user-facing guide in the same commit as a workflow or command change.
- Every documented command must exist and be exercised before its documentation commit is proposed.

## 9. Testing and quality gates

Run the smallest relevant checks during development and all required checks before a commit review.

Baseline checks once available:

```bash
pnpm format:check
pnpm lint
pnpm check
pnpm test
pnpm build
```

Also run `pnpm test:e2e` for user flows, browser interactions, rendering changes, routing, theme behavior, MDX output, and deployment-sensitive behavior.

For visual commits:

- Test representative mobile and desktop widths.
- Inspect light and dark themes.
- Inspect keyboard focus and reduced-motion behavior.
- Capture screenshots for the pre-commit review package.
- Check for overflow, layout shift, clipped text, hydration warnings, and console errors.

For guitar commits:

- Unit-test geometry and scheduling independently of the browser.
- Verify that audio never starts without explicit unmute.
- Verify that desktop pointer crossings produce notes only while `F` is held.
- Verify cleanup on keyup, blur, visibility change, route change, and unmount.
- Test mobile and keyboard fallbacks.

For deployment/security commits:

- Test the production build locally.
- Verify headers and crawler files.
- Verify the externally served raw HTML does not contain plain email addresses.
- Never make production deployment a hidden side effect of a commit.

If a required check cannot run, explain the blocker in the pre-commit review. Do not report a check as passed unless it actually ran successfully.

## 10. Documentation maintenance

- Update `PLAN.md` when an approved product or architecture decision changes.
- Update `IMPLEMENTATIONS.md` when branch order, commit decomposition, dependencies, or acceptance criteria change.
- Update `AGENTS.md` only for repository-wide operating rules.
- Update `README.md`, `DEVELOPMENT.md`, `CONTENT.md`, and `DEPLOYMENT.md` alongside the workflows they describe once those files exist.
- Documentation changes follow the same commit approval gate as code.
- Keep documentation factual. Mark placeholders and deferred decisions explicitly.

## 11. Definition of done

Work is not done merely because code compiles. A feature is done when:

- It meets its documented acceptance criteria.
- Relevant automated checks pass.
- User-visible states were manually reviewed.
- Accessibility and reduced-motion behavior are present where applicable.
- No secrets or raw emails were committed.
- Documentation reflects the implemented behavior.
- Every commit was reviewed and explicitly approved.
- The branch received explicit approval before merge.
