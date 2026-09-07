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
- Git 2.36 or later supports the hook-installation regression tests, which invoke
  hooks directly without creating commits.

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
- `BlueprintPage` owns the continuous vertical rail around its header, main
  content, and footer. `Panel` owns a divided vertical stack; panels and horizontal
  dividers share those rails. The composition rules below keep joins consistent without
  call-site border overrides.
- React components become client islands only when an explicit `client:*` directive
  is necessary.
- `src/components/ui/` contains the curated shadcn-compatible React primitives.
  Static uses render through Astro without hydration; interactive features should
  compose the primitives inside one feature-level island instead of adding a
  `client:*` directive to each control.
  Dialog and Sheet own viewport bounds and vertical scrolling so longer content
  remains reachable on short screens. Use their header components to reserve
  space for the optional close button. CommandDialog composes the shared Dialog
  with the cmdk menu; it uses the same focus lifecycle rather than a second modal
  implementation. Its `open` and `onOpenChange` props control visibility;
  `initialFocus` and `finalFocus` accept the shared Dialog focus options when a
  shortcut or other programmatic opener needs an explicit focus destination.
  CommandInput uses a focus line along the search row instead of a rectangular
  input outline. The line uses the shared focus tokens and system Highlight in
  forced colors; it adds no layout shift and disappears when focus leaves the input.
  Dialog and Sheet reserve the outline's width and offset in scroll padding so
  keyboard focus reveals the complete indicator around footer controls too.
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

### Blueprint composition

`BlueprintPage` creates one frame at least as tall as the viewport. Pass
`BlueprintNavbar` in its `header` slot and footer content in its `footer` slot,
as the site modules in `BaseLayout.astro` do. The footer landmark sits outside
`main` while sharing the same two vertical rails. It owns the horizontal join
after main content; the content stack suppresses its closing rule automatically.
Without a footer, the stack still owns its own closing rule. Standard main-element
props, including `id`, accessible labels, `tabIndex`, and `className`, still apply to
the main landmark. The shell owns width, clipping, and rail geometry. Its frame
paints above section backgrounds, while the sticky header's backdrop spans the
viewport so scrolling stripes do not show through the side gutters.

`--color-blueprint-rule` controls the decorative rails, horizontal rules, and
hatching at 12% ink opacity in both themes, including the system-theme fallback.
Use this token to tune the sketch treatment independently of UI control borders
and keyboard focus indicators.

`Panel` is a flush **vertical stack**. Each visible direct child is a section:

- The stack draws its opening and closing horizontal rules. Every later section
  draws the join above it. Nested panels use the same rule, so parent/child and
  sibling seams have one owner.
- `PanelHeader` contains a title and optional `PanelDescription`. The header
  handles their internal separator. Put `PanelRuleBand` or `StripeSeparator`
  alongside the header or content as a stack section.
- `PanelRuleBand` is the 16px blank band; `StripeSeparator` is the 32px hatched
  band. They can begin, end, or repeat within a stack. Neither draws vertical
  borders. Their visible ending edge comes from the next section or closing
  stack rule when composed inside a panel.
- Use `PanelContent` for padding, prose, flex/grid layouts, and feature islands.
  For another divided stack inside padded content, nest a `Panel` there. Keep
  padding, margins, and layout gaps off the stack itself: those would separate
  edges that are meant to touch. Apply spacing within its sections instead.
- `RailAnnotation` uses 20 px handwritten text at 45% opacity, including its
  arrow. It can appear before, between, or after sections. Its
  `data-panel-overlay` marker excludes it from the flow count. Hidden elements,
  script/style/template nodes, and empty panels also do not introduce joins.

For example, these sections share one pair of vertical rails:

```tsx
<Panel>
  <PanelHeader>
    <PanelTitle>Research</PanelTitle>
  </PanelHeader>
  <PanelRuleBand />
  <PanelContent>Overview</PanelContent>
  <StripeSeparator />
  <Panel>
    <PanelContent>Nested section one</PanelContent>
    <PanelRuleBand />
    <PanelContent>Nested section two</PanelContent>
  </Panel>
</Panel>
```

Keep the `data-blueprint-edge` marker internal to the blueprint modules. Do not
coordinate joins with negative margins or per-instance border suppression.
Rules paint above section backgrounds and ignore pointer events. All composition
behavior is CSS; no React context, child inspection, observer, or hydration is
required. The CSS uses the standard filtered
[`nth-child(... of selector)` syntax](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:nth-child#the_of_selector_syntax)
to count flow sections even when overlays interrupt the DOM order.

### Theme behavior

`src/lib/theme.ts` owns the supported themes, tokens, and pure preference policy.
`BaseLayout.astro` keeps the small inline bootstrap before styles so the initial
theme does not wait for a downloaded module. Keep that synchronous first-paint
step when extending theme behavior.

`src/lib/theme-controller.ts` owns browser state, persistence, system changes,
cross-tab updates, metadata, and all theme controls' accessible labels. The Astro
theme control calls `initializeTheme()` after the document is parsed. Repeated calls
reuse the same controller for the current document. This lifecycle follows the
site's normal full-page navigation; there is no client router. The theme toggle
lives in the header. `BaseLayout.astro` owns one live announcement region for the
page.

Feature handlers, including the lab's theme command, call `toggleTheme()` from
that module. Do not click the header programmatically or write theme attributes
and storage independently. The import has no browser side effects, so React
islands can import it during static rendering and call it from browser events.

An explicit choice overrides the system theme. Removing, clearing, or invalidating
the saved choice in another tab restores the live system preference. Unrelated
keys and session storage events are ignored. If storage is blocked, switching
still works for the current page. `tests/e2e/theme.spec.ts` covers these browser
cases, while the homepage suite retains first-paint, reload, and no-JavaScript
checks. The lab suite exercises the shared command and header behavior.

### Shared site navigation and footer

The homepage at `/` uses `src/components/site/HomeHero.astro` for static identity
copy and layout. Only its guitar SVG hydrates as a React island. Development and
production render the same selected design, with no variants or design chooser.
The guitar uses a filled sound hole and a 35-degree angle, with compact copy at
the bottom left. Its drawing spans the full hero on desktop; below 768 px it
stacks below the text and crops to an enlarged instrument for touch. Its SVG
uses 250% width with a -135% left margin and a 4% upward translation. These
offsets center the sound hole in both axes at 80% of the figure width. Desktop
restores the full SVG view. The right rail annotation
places its arrow above the two-line interaction hint; the shared component hides
it when there is no gutter space. The figure retains screen-reader instructions,
with no visible caption/status or duplicate navigation row. Run the interaction
and responsive checks with `pnpm test:e2e guitar.spec.ts`.

On mobile, a static `Skip guitar` link sits opposite the sound toggle above the
strings and stays below the sticky header while the guitar is on screen. Its
sticky overlay uses a negative bottom margin to preserve the drawing's layout.
It targets the focusable `#after-guitar` panel using native fragment
navigation and a scroll margin for the sticky header. This offers a way past the
touch surface before hydration and without JavaScript; it adds no input handler
to the guitar island.

`src/components/guitar/GuitarStrings.tsx` renders the static SVG and owns input
lifecycle. `string-geometry.ts` owns finite-segment crossings and gauge order;
`string-motion.ts` owns one on-demand animation loop and direct SVG updates.
Clicking or tapping a string plucks it on release. A 6 CSS pixel movement allowance
keeps small pointer jitter from starting a strum. Moving farther while holding
the primary pointer strums crossed strings, retaining the segment from the press
point. Releasing after a drag adds no pluck; cancellation discards pending clicks.
Touch uses the same one-finger gesture; Tab then Enter/Space plucks immediately.
Reduced motion gives a brief highlight instead of vibration. `GuitarPlayer.tsx`
wraps the drawing as the single homepage island with an icon-only sound toggle
at the top right and note names stacked below it, high to low. Both align with
the header theme toggle; notes use `--color-blueprint-rule` and the icon uses
45% foreground opacity. CSS anchors the icon
with equal top/right padding inside the hero rail on desktop and inside the
stacked guitar on mobile. A ResizeObserver measures where the first resting
string reaches the column; flexbox centers the notes between the icon's hit area
and that boundary, with a small upward optical adjustment in CSS. It runs on
layout changes, not animation frames. No volume slider is
shown on the homepage. No audio context, Tone import, bank module, or sample download is
started before activation. Mute, loading failure, page exit, and unmount dispose
the engine; blur and leaving the hero stop its current notes.

#### Guitar sound audition

Visit `/lab/guitar` during `pnpm dev` to compare Shinyguitar acoustic archtop,
FreePats steel-string, Quartertone classical, and University of Iowa samples.
Select a library, enable sound, and play the reference
phrase or use the existing click/tap, drag, and keyboard gestures. C (Yamaha)
is selected initially. The phrase uses
six isolated notes and ordered down/up strums; the strength slider affects the
phrase and note buttons, while drag speed controls the gesture's strength.

The current chord is E♭m11/B♭: `664664` from low E to high E in standard tuning.
It sounds `B♭2 E♭3 G♭3 D♭4 F4 A♭4`, the requested `5–1–♭3–♭7–9–11` voicing
with E♭ as root. Labels use flat spellings to match the chord.
Edit the chord name and frets in `src/components/guitar/voicing.ts` to change it;
the SVG's accessible labels, audition note buttons, and all four sample banks
derive their sounding pitches from that configuration. Sample source pitches
stay unchanged; the engine adjusts playback rate to each fretted pitch, with
no extra download or asset preparation step.

`src/components/guitar/audio/guitar-audio.ts` owns one audio context, lazy Tone.js
initialization, cached decoded buffers, sample voices, and cleanup. The visual
component emits `GuitarPluck` data and imports no audio implementation. This keeps
the drawing independent of audio. The homepage dynamically imports only the
Yamaha bank; the other libraries remain lab-only. Changing libraries
stops current/scheduled notes; mute, load failure, and unmount dispose the engine.
Blur and hidden-page events stop playback. Returning to the page does not replay
the reference phrase.

`src/lab/guitar-samples.ts` connects Vite asset URLs to the generated manifest in
`src/lab/assets/guitar/` and the shared Yamaha bank in `src/assets/guitar/`.
The adjacent READMEs and license files document sources and
processing. The explicit `pnpm samples:prepare` command requires `ffmpeg` and
`tar` on PATH, downloads the pinned upstream recordings into an ignored cache,
and regenerates the audition subset. It never runs on install or build. The FSS
WAV files remain unmodified; Shinyguitar's CC0 WAVs are converted to mono MP3.
Quartertone's public MP3 previews use a short tail fade with no sustain loops;
the strongest fifth tier is omitted. Its remaining four tiers span the complete
velocity range while preserving the original whole-bank gain trim. `strumStrength`
in `pluck.ts` provides the gentler speed-to-loudness curve without changing visual
vibration. Only the 24 selected Yamaha files are emitted in production.
their versioned acquisition table records each file's attribution and checksum.
Iowa's open notes are isolated from chromatic-scale recordings using reviewed
end times, with a 30 Hz subsonic filter and short tail fade. Level matching uses
one gain adjustment per library; no reverb is added. Only the selected library's
audio files download when sound is enabled or the library is changed.

Run `pnpm test guitar-audio guitar-samples` for mapping/lifecycle checks and
`pnpm test:lab guitar-audio.spec.ts` for browser decoding, scheduling, gesture,
failure, and accessibility checks. Browser tests observe Web Audio calls; they
do not record microphone or system output. Judge the actual timbre by listening
in the audition before choosing the production library.

`src/components/site/SiteHeader.astro` owns the static `sky lu.` wordmark, public
navigation records, and current-page labels. The wordmark reuses the preloaded
Geist font and needs no client code. `SiteFooter.astro` consumes the shared profile's
social links and renders the notebook sign-off, design attribution, and native
back-to-top link. The link sits outside the right rail from the `lg` breakpoint
and stays in the footer row on smaller screens. `FooterListening.astro` reads song metadata from
`src/data/listening.ts` and composes the shared `TurntableDrawing.astro` SVG.
No Spotify embed, redirect, SDK, or account connection is used.
`RecordPlayer.astro` accepts a readonly playlist and renders its metadata statically.
`record-playlist.ts` validates authored IDs, titles, and URLs during the build.
The bottom-row
Privacy link opens `src/pages/privacy.astro`, a static statement about theme
storage, ordinary connection information, and external links. Update that page
when the site's data practices change.

The audio boundary is `src/lib/local-record.ts`: it loads the source only after
a gesture, handles native playback events and failed/interrupted play promises,
and releases the audio on navigation or disconnect. Only one record plays at a
time. `src/lib/turntable-control.ts` owns pointer capture, keyboard input, and a
constrained SVG rotation. `turntable-geometry.ts` defines its pivot and allowed
arc. The control emits playback requests; only actual media events set its
`playing` attribute. `vinyl-selector.ts` handles vertical vinyl gestures and
eased record transitions independently of audio and metadata. Translation and
spin use nested SVG groups so their transforms cannot overwrite each other.
Selection parks the arm, pauses playback, resets the source, and leaves the new
record ready for an explicit play gesture. Metadata and no-JavaScript links come
from the same static playlist; a grid reserves the tallest caption's space.
Anime.js's WAAPI module loads on the first spin or record transition;
native transforms do the per-frame work. Reduced motion disables spin, and
offscreen/hidden-tab animation pauses without stopping the music.

`/lab/turntable` uses the same components with two clearly labeled specimens of
the same 330 KB CC0 jazz demo, and can read a file selected in the browser without
uploading it. The footer uses the real playlist in both development and production.
`src/lab/listening-demo.ts` is imported only by the development-only lab route;
neither the fixture nor its lab route ships in `dist`.
The native audio element is hidden; visitors can drag the tonearm or operate it
with arrow keys, Home, End, and Enter/Space.
The no-JavaScript fallback links directly to the recording. See `CONTENT.md` for
switching to a published audio URL; no R2 binding or backend is needed in the player.
The handwritten sign-off uses the existing self-hosted Caveat font, so it now
loads on every page with the shared footer.
`BaseLayout.astro` composes these through the blueprint slots and owns the `top`
anchor. All links work without JavaScript; theme buttons remain hidden until the
controller is available. New section links arrive alongside their actual targets.

`src/lib/build-info.server.ts` reads the UTC build date once per module instance.
It displays a seven-character revision only when the build environment supplies
a valid full `GITHUB_SHA` (GitHub Actions supplies this automatically). Local and
archive builds can omit it. This public identifier is optional; no Git process,
network request, or browser script is needed. Import this module only from Astro
frontmatter or other build-side code. The footer date describes the build, not
the last editorial update to the content.

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
| `pnpm lint`            | Generate Astro types, then lint without changing source.      |
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
| `pnpm verify:full`     | Run `verify`, production browser, and portable lab checks.    |
| `pnpm run prepare`     | Reinstall the local pre-commit hook.                          |

`pnpm cf:preview` is intentionally unavailable until Stage 09 adds Wrangler. No
install, build, preview, verify, or Git hook command deploys the website.

Both lint commands run `astro sync` first to generate the ignored `.astro` content
types. A fresh checkout can run `pnpm lint`, `pnpm lint:fix`, or `pnpm verify`
without first starting the development server or building the site. `pnpm lint`
does not modify source files; `pnpm lint:fix` applies ESLint's safe source fixes.

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

### Browser servers and worktrees

Each browser suite starts and stops its own server from the current checkout.
Production tests build first and use port 4322; lab tests use port 4323. Your
interactive `pnpm dev` server can keep running on its usual port 4321. Tests refuse
to reuse an occupied port, so another worktree cannot silently supply the page
being tested.

When another checkout is already running browser tests, choose free ports through
these optional shell environment variables:

```bash
PLAYWRIGHT_E2E_PORT=4422 PLAYWRIGHT_LAB_PORT=4423 pnpm verify:full
```

The same overrides apply to the individual suites and their UI/snapshot commands.
Pass decimal integers from 1 to 65535. These are test-runner settings read from the
shell, not application settings loaded from `.env.local`. An invalid value fails
before server startup; an occupied port fails instead of selecting a different one.

`tests/support/browser-server.ts` owns port validation, loopback URLs, and server
startup policy. The two Playwright configs retain their suite-specific test,
retry, and reporting settings. Servers explicitly use production or development
`NODE_ENV` to match their suite, including when started from an editor terminal.
The lab launcher in `scripts/serve-lab.ts` uses
Astro's programmatic dev API so it leaves the interactive CLI server's lock alone.
It also has a separate Vite optimization cache. Playwright manages its lifetime.

Failure artifacts live in `test-results/e2e/` and `test-results/lab/`. Running one
suite no longer clears the other's results or downloaded CI traces. Keep concurrent
runs in separate worktrees: builds and generated Astro state still belong to one
checkout, even when server ports differ.

### Component lab

The development-only `/lab` uses the real Astro layout, theme controller, Tailwind
configuration, and React island boundary. It replaces Storybook initially and
contains token, typography, rail-annotation, static-control, disclosure, tooltip,
overlay, and command-menu specimens. Rail annotations appear outside the content
rail at the `xl` breakpoint, so review them at 1280 px or wider. Astro's development
toolbar remains available during manual use; the lab's automated checks hide that
overlay so audits and screenshots measure only the application UI.

The **Layout cases** link opens `/lab/blueprint/adjacent`. Its navigation exposes
`dividers`, `nested`, `overlays`, `short`, `pairs`, `descriptions`, and `surfaces`.
These static fixtures cover all nine panel/band/stripe pairings, deep nesting,
empty/hidden sections, annotations, and opaque backgrounds. They are injected
only during development, alongside `/lab`, and never enter the production build.
The portable lab suite checks every seam across four widths and both themes with
JavaScript disabled, plus screenshot pixels, full-height rails, and accessibility.

`RailAnnotation` accepts Tailwind positioning utilities through `className` for
call-site optical adjustments. Match the utility to the selected alignment:

```tsx
<RailAnnotation side="left" align="start" className="top-5">
  Move a start-aligned note down 4px
</RailAnnotation>

<RailAnnotation side="right" align="end" className="bottom-3">
  Move an end-aligned note down 4px
</RailAnnotation>

<RailAnnotation
  side="right"
  align="center"
  className="top-[calc(50%+0.25rem)]"
>
  Move a centered note down 4px
</RailAnnotation>
```

Use `top-*` with `align="start"`, `bottom-*` with `align="end"`, and adjust the
`top` calculation with `align="center"`. Mixing `top-*` into an end-aligned note
leaves both top and bottom constraints active and can stretch its absolute box.
Annotations remain hidden below the `xl` breakpoint (1280 px) and while printing,
regardless of these positioning overrides. Avoid passing display utilities such
as `flex`, which would override that responsive guard.

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
artifact. Its `scripts/serve-preview.ts` starts Astro's programmatic static preview
with a strict port, preserving directory-index routing and the real 404 response.
It does not use Vite's standalone SPA fallback, which can serve the homepage for
an extensionless content URL. The deployed Cloudflare policy remains Stage 09.

### Content page development

See [CONTENT.md](CONTENT.md) for schemas, drafts, project records, and layout
ownership. `/lab/content/writing` displays a populated writing index;
`/lab/content/article` renders the unpublished prose specimen. The public writing
page stays empty until an article is explicitly published. These previews use the
same index/reader components as the public routes.

`LineNav` in `src/components/blueprint/` is a static adaptation of the reference
component. It uses ordinary anchors, wrapping text, visible keyboard focus, and
CSS marker feedback. Its `activeHref` prop represents an active page; it does not
install scroll tracking. Reading pages pass build-generated second-level headings.

### Sketch underlines

`SketchUnderline` in `src/components/blueprint/` is a static React renderer for
an inline custom element. Use it in Astro or React without hydration:

```tsx
<a href="/projects/tundra">
  <SketchUnderline text="Tundra" seed="project:tundra" />
</a>
```

The `text` prop is required. The optional `seed` defaults to that text; distinct
seeds produce different repeatable pen gestures. Marks appear only on hover,
including for the current page. Keep icons outside the label and set typography
on the surrounding element. The component inherits color and font size, and
provides a 1.6 line height to leave room for marks under wrapped text.

`BaseLayout` loads the small shared enhancement in `src/lib/sketch-underline.ts`.
Each instance caches one SVG path per encountered text line. CSS traces the stroke
on hover in 187ms and retraces it backward on exit in 140ms. Reversing direction
mid-transition continues from the current point. No pointer listeners, path
generation, or layout reads run for those interactions. Paths survive reflow and
reconnection; their coordinates are refreshed only when their size changes.
A stable seed reproduces the same gesture on a later page load without storage.

One shared ResizeObserver watches the nearest layout containers. Text mutations
and font loading also invalidate measurements. A single scheduled frame reads all
dirty labels before writing SVG geometry, and unchanged geometry causes no
write. Observations/listeners are removed on disconnection. SVGs occupy no layout
space, are hidden from assistive technology, and cannot intercept a pointer.

`src/lib/sketch-path.ts` owns the deterministic curve generation;
`src/styles/sketch-underline.css` owns stroke width, 72% current-color opacity,
hover transitions, reduced motion, and forced-colors fallbacks. Each path uses
`pathLength="1"`: moving its dash offset from 1 to 0 draws it; returning to 1
erases it. Visibility switches off after erasing, hiding rounded endpoint dots.
Opacity stays constant throughout. Reduced motion makes both changes immediate.
Keyboard focus keeps the native outline; touch devices do not acquire sticky
sketch marks. Normal underlines remain available without JavaScript and in forced
colors. No animation library or React client runtime is loaded for this effect.
Ordinary prose links retain native underlines unless an author opts into the component.

Review `/lab/underline` for small labels, large titles, multiline headings, and
links inside prose. The browser tests exercise actual path reuse, container
resizing, text changes, reconnection, both stroke directions and interrupted
transitions, keyboard navigation, and fallbacks.

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
- Astro generates ignored content types before ESLint checks staged Astro,
  JavaScript, and TypeScript source. Type generation receives no staged filenames;
  ESLint still checks only the matching staged files.

The installer asks Git for the effective hook directory, so linked worktrees and
relative, global, or worktree-specific `core.hooksPath` settings work correctly.
The project manages `pre-commit` and preserves unrelated hooks. Default hooks are
shared by linked worktrees; the hook runs `pnpm exec lint-staged` in whichever
worktree invokes it. Installation failures now return a failing exit status.

A small, version-specific pnpm patch fixes these behaviors in `simple-git-hooks`
2.13.1. `pnpm install --frozen-lockfile` applies it automatically; do not edit
installed dependencies by hand. See [patch maintenance](./patches/README.md) before
upgrading that package. The dependency's own postinstall remains blocked; only
the root `prepare` command installs project hooks.

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

Then ask Git where the hook should exist:

```bash
git rev-parse --path-format=absolute --git-path hooks/pre-commit
```

Inspect that path instead of assuming `.git` is a directory. A GUI Git client
launched outside your shell may also need the pinned Node and pnpm binaries on
its `PATH`.

## CI parity

GitHub Actions uses two stable required jobs:

- **Quality** installs the frozen lockfile, runs `pnpm verify`, and reports unit
  coverage.
- **Browser** waits for Quality, installs Chromium, runs the production suite and the
  non-visual `/lab` checks, and uploads seven-day failure artifacts.

Run `pnpm verify:full` for the same required quality, production-browser, and portable
lab checks. CI also runs `pnpm test:coverage` for reporting. Local visual snapshots
remain a separate `pnpm test:lab` check because they are platform-specific. CI has
read-only repository contents permission and no deployment credentials or deployment
step.

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

Browser tests use port 4322 for production and 4323 for the lab. Leave another
checkout's server running and choose free `PLAYWRIGHT_E2E_PORT` and
`PLAYWRIGHT_LAB_PORT` values as shown under
[Browser servers and worktrees](#browser-servers-and-worktrees). Both suites refuse
to reuse an existing server.

### Local checks pass but CI fails

Use the pinned Node and pnpm versions, reinstall with `--frozen-lockfile`, and run
`pnpm verify:full`. Compare CI's first failing command rather than only its final job
status. For browser failures, download and inspect the trace as described above.
