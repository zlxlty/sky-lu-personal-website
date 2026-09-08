# Sky Lu Personal Website - Implementation Plan

Status: approved direction, Stage 02 in final branch review
Last updated: 2026-08-27
Primary priorities, in order: implementation simplicity, load speed, expressiveness, accessibility

## 1. Product definition

Build a fast, content-first personal website that establishes Sky Lu as:

1. An M.S. student in Computer Science at Brown University.
2. A software engineer with experience in edge infrastructure and AI systems.
3. A network and distributed-systems researcher in Brown's ATLAS Group, working with Nikos Vasilakis.
4. A jazz guitarist with a distinctive interactive six-string instrument in the homepage hero.

The site is both a portfolio and a technical blog. It should feel like a carefully engineered personal document, not a startup landing page and not a generic developer template.

### Success criteria

- A visitor understands Sky's four-part identity within the first viewport.
- The playable guitar is the hero's primary interactive visual, not a lower-page reveal.
- The homepage is useful with JavaScript disabled; only explicit interactive islands require JavaScript.
- Articles support code, math, Mermaid diagrams, forms, and embedded interactive components through MDX.
- The guitar supports individual plucks and ordered multi-string strums while the primary pointer is held down over the instrument.
- Static pages remain fast and cacheable on Cloudflare.
- Both light and dark themes are supported.
- The public site contains no comments, reactions, view counts, guestbook, authentication, CMS, or unnecessary database.
- Search engines and link-preview crawlers can index public content while abusive bots, email harvesters, and future form spam receive targeted mitigation.

## 2. Confirmed decisions

| Area | Decision |
| --- | --- |
| Framework | Astro, TypeScript strict mode |
| Interactive UI | React islands only where interaction requires it |
| UI components | A small, curated subset of shadcn/ui components |
| Styling | Tailwind CSS v4 plus CSS custom-property design tokens |
| Content | Git-authored Markdown and MDX in Astro content collections |
| Hosting | Cloudflare Workers Static Assets |
| Rendering | Static generation by default; no SSR in v1 |
| Guitar audio | Recorded acoustic samples through lazy Tone.js, E♭m11/B♭ voicing |
| Animation | Anime.js v4 for authored motion; custom `requestAnimationFrame` for string physics |
| Theme | Warm light palette (`#FCF3E6` / `#38332F`) and brown dark palette (`#2B2724` / `#AE9877`) |
| Contact | Display Brown and personal email addresses, supplied as deployment secrets, with anti-harvesting measures |
| Research | ATLAS Group; worked with Nikos Vasilakis; feature Tundra |
| Social features | None in v1 |
| Component workshop | A local `/lab` route, not Storybook initially |
| Monitoring | Cloudflare observability at launch; Sentry after the first public interactive release |
| Photograph | Reserved layout slot; real photograph will be uploaded later |

## 3. Inspiration and originality boundary

The homepage selectively ports the MIT-licensed blueprint layout modules from
`ncdai/chanhdai.com`. The adapted React modules render statically through Astro
without hydration. The imported source revision and license are recorded in
`THIRD_PARTY_NOTICES.md`, and the result must not look like a rebadged copy.

### Patterns to reuse

- Narrow centered document rail.
- Persistent vertical grid lines and horizontal section separators.
- The upstream Panel family, screen-line utilities, and hatched separators,
  adapted to Sky's tokens and content.
- Compact sticky navigation.
- Large technical illustration near the top.
- Small figure captions, rail-aware handwritten annotations, keycaps, metadata,
  and superscript counts.
- Expandable experience and project records.
- Command palette, theme switcher, tooltips, badges, separators, and copy buttons.
- MDX-based content and good code-block presentation.

### Patterns not to copy

- Chanhdai wordmark, mark geometry, avatar treatment, personal data, illustrations, or branded assets.
- Exact header composition, exact section order, exact spacing values, or exact animation choreography.
- A presentation close enough to imply that Chanhdai designed or maintains this site.

### Sky-specific visual identity

- Warm ink/brass color system rather than neutral black/white.
- An interactive six-string guitar as the primary hero figure.
- Systems and research content before general experience.
- An original packet-routing/network figure in the research section.
- A substantial jazz narrative section that supports, but does not duplicate, the hero instrument.
- Geist Sans for display headings, paired with IBM Plex Sans and IBM Plex Mono
  for Sky's body and technical typography.
- A distinct monogram or portrait treatment, to be finalized when a photograph is provided.

If substantial source code is ported from the reference repository, preserve the applicable MIT copyright notice in the repository's third-party notices.

## 4. Information architecture

### Public routes

| Route | Purpose | Rendering |
| --- | --- | --- |
| `/` | Curated homepage and portfolio | Static |
| `/writing` | Filterable article index | Static |
| `/writing/[slug]` | MDX article | Static |
| `/projects` | All systems and software projects | Static |
| `/projects/[slug]` | Project case study where available | Static |
| `/rss.xml` | Blog feed | Build output |
| `/sitemap-index.xml` | Search sitemap | Build output |
| `/robots.txt` | Crawler policy | Static |
| `/404` | Branded not-found page | Static |

### Development-only route

`/lab` is a component and interaction workshop. It must be excluded from the production build or protected behind an environment flag.

The lab contains:

- Guitar states: muted, armed, plucked, strummed, reduced-motion, unavailable audio.
- Light and dark color tokens.
- Buttons, tooltips, badges, collapsibles, dialogs, command palette, and focus states.
- MDX examples for code, math, Mermaid, figures, and forms.
- Responsive layout specimens.

## 5. Homepage specification

### 5.1 Sticky navigation

Desktop navigation:

- Lowercase `sky lu.` wordmark/home link.
- `Work`, `Research`, `Writing`, and `Jazz` anchor links.
- Command/search button with `Cmd/Ctrl + K` hint.
- GitHub link.
- Theme toggle.

Mobile navigation:

- The same wordmark/home link.
- Command/search button.
- Menu button opening a shadcn Sheet or Dialog.
- Theme toggle remains directly reachable.

The header is approximately 52 px tall, sticky, and uses a lightly translucent paper background with `backdrop-filter` only where supported.
Omit the wordmark/home link on the homepage, where the hero already provides the
identity. Keep navigation and the theme control aligned right on every page.
On the homepage, fade the background and its blur from transparent at scroll
position zero to the standard paper mask over the first 96 px of scrolling,
using an eased, reversible opacity curve. Reduced motion uses an immediate mask
after scrolling begins; without JavaScript, retain the standard background.

The approved header identity is an editorial `sky lu.` wordmark in the existing
Geist font, with a semibold first name, lighter surname, and tight optical spacing.
It inherits the theme's text color and renders as static text. Its home link has
the accessible name `Sky Lu — Home`. The navbar owns its left inset, aligning the
wordmark with standard panel content at every viewport width.

### 5.2 Hero: interactive six-string guitar

The hero pairs the identity block with the playable guitar. On wide screens, the strings receive the wide visual rail while the identity copy remains compact; on narrow screens, identity, controls, and strings stack without hiding the instrument below another content section. The guitar is the first and primary interactive figure.

Behavior:

- Render a meaningful static six-string SVG before the React island hydrates.
- Render six strings and a sound hole,
  with the neck pointing toward the upper left and string 6 (low E, thickest)
  below string 1 (high E).
- Put `Click to pluck` and `Drag to strum` on separate lines in a right-side
  `RailAnnotation`, with its arrow above the text. It follows the shared gutter
  visibility breakpoint. Keep instructions and status accessible to screen
  readers without a visible caption or status row beneath the guitar.
- The selected visual pairs a filled sound hole with a side-by-side
  composition, using a 35-degree string angle. Compact identity copy sits at
  the bottom left, clear of the strings. The drawing spans the full hero so
  strings reach its outer edge without being cut off by the text column.
  On desktop, extend the same SVG strings upward behind the navbar, clipped to
  the page rails and the navbar's top. Keep navigation above the drawing and
  retain the instrument's original pointer-interaction boundary.
  Below 768 px, the guitar stacks beneath the copy and uses an enlarged crop
  for touch: the sound hole fills roughly 80% of the figure width and all six
  strings stay individually reachable. Keep the complete sound hole centered
  horizontally and vertically in the mobile figure.
- Place a mobile-only `Skip guitar` link at the instrument's top left, opposite
  the sound toggle. Keep it sticky below the header while the instrument is on
  screen. Its native fragment link moves focus to the next content
  panel, clear of the sticky header, without using a strumming gesture. Keep it
  usable before hydration and without JavaScript, with a 44 px touch height.
- An icon-only sound toggle activates the selected Yamaha recordings from the
  hero's top-right corner, aligned with the header's theme toggle. Stack the six
  note names beneath it along the inside of the right rail, highest first and
  B♭ at the bottom. Give the icon equal top and right padding, and place the
  note column slightly above the midpoint between its hit area and the first string. Use the blueprint rail
  color token for the notes and 45% foreground opacity for the icon. On narrow screens,
  anchor this column to the guitar beneath the copy. Keep the drawing slightly
  lower and clear of the controls. Give the icon a 44 px target. Start muted on
  every visit; show loading, cancellation, and retry states
  without changing the drawing or blocking silent interaction. No volume slider.
- Keep Tone.js out of the initial bundle and load it only after explicit unmute.
- Preserve visual plucking while muted, but never produce sound before explicit activation.
- Use the documented reduced-motion, keyboard, and touch alternatives without moving the instrument to another section.
- Do not place a competing pointer-driven network interaction in the hero.

### 5.3 Hero identity block

Initial copy:

> # sky lu.
>
> I'm a CS master's student at Brown, learning and building abstractions.

Render the hero title with the same editorial wordmark as the navbar, scaled to
the hero's responsive heading size. Share its typography and optical spacing in
one static component.
Hovering or focusing `sky` in the hero reveals `Legal Name: Tianyi Lu`. Keep
the tooltip outside the heading's accessible name, dismissible with Escape,
and available as a native title without JavaScript.

The hero eyebrow reads `Sincere,Compassionate,Tolerant`. Keep “learning and building”
together when the introduction wraps. The overview below introduces the people,
communities, and everyday pursuits that motivate Sky.

Compact identity labels:

- Brown M.S. CS '27
- Software Engineer
- Network Systems Researcher
- Jazz Guitarist

Writing and Projects remain in the shared header rather than being repeated
in a link row beneath the hero identity. GitHub remains available in the footer.

Reserve a portrait slot that can initially contain an abstract monogram or neutral placeholder. Do not fabricate a face or use a stock portrait.

### 5.4 Overview

Lead with the personal essay `This is [not] a résumé.` under `01 / A little
honesty`. Preserve the user's candid voice: motivation from people and
communities, sincerity, compassion, tolerance, and a little idealism. Use short
paragraphs and a natural transition into distributed inference systems, learning
jazz guitar, cooking, bouldering, badminton, and pool.

Link `UWCCSC` to `https://www.uwcchina.org/en` and `X Academy` to
`https://info.xacademy.cc/`, using the shared hover-only sketch underline. The
word `pool` has a hover/focus hint: `The dry one. Tables, cues, that sort of thing.`
Hints remain hoverable, support Escape, fit the viewport, and use native titles
without JavaScript.

Use the selected blueprint-notes composition: a split title and introduction
above four labeled rows—Drives, Communities, Enjoyments, and Timeline. Narrow
screens stack labels above content. Nested panels own the row rules, and normal
content rows use equal horizontal and vertical padding from `PanelContent`.
Keep `#after-guitar` as the native, focusable guitar skip destination.
The Timeline row contains personal milestones from May 2027 back to May 2020,
authored together in `src/data/timeline.ts`. Use a reusable static horizontal
timeline: dates above connected open circles, titles and short anecdotes below.
Show the most recent entries first, with the next card partially visible. Hide
the scrollbar and omit direction labels and arrow buttons. While the pointer is
over the timeline, vertical wheel gestures move it horizontally; at either end,
let scrolling continue down or up the page. Preserve native horizontal trackpad
and touch swipes, focused-region Left/Right/Home/End keys, reduced motion, and
native horizontal scrolling without JavaScript. Keep the
user's humor and their supplied Cave and Zacc links with sketch underlines.
Place a right RailAnnotation beside the timeline: "Scroll to the past", with
the arrow below the text. Preserve its existing narrow-screen hiding behavior.
The next section is Writings, separated by a StripeSeparator and PanelRuleBand.
Research context remains in the Tundra project.

### 5.5 Selected systems work

Show four editorial project records. Each record has a short summary, measurable outcome, technology tags, and optional details disclosure.

Match the Writings section header: a `text-4xl` title, 16px padding on every side,
and a StripeSeparator followed by PanelRuleBand before the section.

Arrange homepage project records in two columns from the `sm` breakpoint, and
one column below it. Preserve all record content except per-project numbering;
retain company and category labels. The blueprint PanelGrid owns
a 16px center gutter with paired vertical lines and 16px ruled horizontal bands.
Only the first cell in each row paints full-width horizontal rules; the page
continues to own its outer rails. Metrics sit below the project text.

#### Dynamic Pages at Cloudflare

- Drove delivery across six Kubernetes services.
- Enabled more than 3,000 enterprise accounts to customize Access login and block pages.
- Propagated durable PostgreSQL records to edge KV within 500 ms.
- Served custom pages at sub-200 ms p95 latency.

#### Efficient LLM serving

- Built a cost-aware LLM router with a ModernBERT-based quality predictor.
- Deployed inference as a serverless GPU service with sub-200 ms latency.
- Benchmarked Kimi K3, DSpark, SGLang, and Mooncake on B300 Kubernetes clusters.
- Improved tokens per second by 108% using speculative decoding and prefill/decode disaggregation.

#### Tundra

- Affiliation: Brown ATLAS Group.
- Collaboration: Nikos Vasilakis.
- Rust communication library composed from message-stream transformations.
- Gives developers explicit control over networking guarantees.
- Demonstrated 30% higher Memcached throughput, 20% lower latency, and a 5x reduction in networking code.
- Add a repository, paper, poster, or lab-project URL when a canonical public URL is provided. Do not invent one.

#### KVonset

- High-performance in-memory key-value store in Rust.
- Edge-triggered epoll, multithreaded accept, nonblocking I/O state machine.
- Hybrid lock-free storage with a hot-key cache and sharded concurrent hash map.
- Achieved 335K keys/s with p95 latency below 170 microseconds.

### 5.6 Experience

Collapsed experience order:

1. Cloudflare - Software Engineer Intern - May 2026 to August 2026.
2. Z.ai - Software Engineer Intern - December 2025 to February 2026.
3. Flowith - Software Engineer Intern - March 2025 to August 2025.
4. QuantInfinite - Software Engineer Intern - June 2024 to September 2024.

Each collapsed row contains company, role, dates, location, and a one-line contribution. Expanded content contains at most three bullets.

### 5.7 Writings section

The September 7, 2026 decision replaces the homepage Research section with
Writings. Match Selected Work's heading and stacked editorial rows, without
numbering individual topics. Use 16px horizontal and vertical section padding,
and omit an additional All writings link. Introduce the notebook in Sky's conversational
voice, then show four tentative ideas: improvisational cooking, Sichuan hotpot,
jazz guitar learning, and category theory with jazz improvisation. Link
The Joy of Abstraction using the shared sketch underline.

Keep the introduction and ideas in `src/data/writings.ts`, shared by the homepage
and `/writing`. These are ideas, not published articles: no invented dates or
article links. The navigation label is Writings; retain existing `/writing` URLs.
The former homepage research figure is no longer planned for this section.
Place a left RailAnnotation beside the jazz guitar journal idea, with its arrow
above "Dumping all my short recordings here." Keep the note with the idea in
the shared content data so it appears on both the homepage and Writings page.

The following research proposal is superseded, retained as historical context:

Section heading: `Research / ATLAS Group`

Initial copy:

> The ATLAS Group at Brown builds systems that help programmers manage the complexity of modern software. My work with Nikos Vasilakis focused on Tundra: composable message-stream transformations for making communication behavior explicit and optimizable.

Include:

- Link to `https://atlas.cs.brown.edu/`.
- Link Nikos Vasilakis to the ATLAS team page or his Brown profile.
- Tundra project card.
- Research-interest tags: network systems, distributed systems, systems transformation, performance.
- A future publication/preprint slot, hidden until there is something canonical to cite.
- An original SVG packet-routing figure with sparse nodes, queues, links, and moving packets. Its nearest route may bend subtly toward the pointer, it must pause offscreen or when the tab is hidden, and its reduced-motion fallback is static.

Proposed research figure caption:

> Fig. 2. Systems are paths, queues, and choices under constraints.

### 5.8 Jazz narrative section

Section heading: `Jazz / Six strings, many possible paths`

Initial copy:

> Jazz gives me a different way to work with structure: listening closely, making local decisions, and finding motion inside constraints. I play jazz guitar and care about the small changes that make a voicing breathe.

The playable instrument remains in the hero; do not mount a second guitar island here. Include a `Play the hero guitar` link back to the instrument and repeat the concise usage hint for visitors who arrived through the `Jazz` anchor:

> Hold the mouse button and drag across the strings.

The actual mute/unmute control stays beside the hero instrument and always exposes a text label to assistive technology.

### 5.9 Writings

The Writings index introduces the personal notebook and tentative topics from
§5.7. Render published articles when available, using the existing draft-filtered
blog collection. Do not show the old technical-only empty state beside the ideas.

Initial topic taxonomy:

- Network systems
- Distributed systems
- Edge infrastructure
- Efficient AI serving
- Engineering notes
- Jazz and listening

### 5.10 Footer

Include:

- Editorial notebook sign-off: "Simmer, strace & strum." and a handwritten
  "Thanks for being here at this moment."
- A minimal vinyl, tonearm, and cartridge drawing beside the sign-off, stacked
  below it on mobile. Play Sky's uploaded covers from the authored playlist.
  The enlarged disc has asymmetric
  label details and a centered cartridge and needle. A native audio player uses
  owner-hosted files served through Cloudflare R2. Drag the arm through a
  fixed 0–34° arc: picking it up pauses; releasing over the grooves resumes;
  releasing outside parks it. The vinyl follows actual audio playback, without
  visible playing/paused text. The tonearm also supports keyboard input; the
  native audio controls are hidden. No Spotify embed, SDK, or sign-in is used.
- Swipe the vinyl up/down to select next/previous records with a short eased
  exit and entrance. Selection wraps; changing records pauses and parks the arm,
  without automatically starting the next track. The vinyl itself is keyboard
  focusable, with Up/Down to switch; omit selection buttons and counters.
  Keep URLs, titles, authors, and record/album names in
  one typed playlist. No publication date is shown. A single-track playlist hides
  switching controls; empty playlists show a static drawing.
- Use a small CC0 jazz demo only in the development lab. No audio is fetched
  before a listening action. Motion respects reduced motion and pauses while
  offscreen; navigation releases playback.
- A bottom-row Privacy link to a dedicated static statement about browser
  preferences, connection information, and external services.
- Git commit/build identifier when available.
- Build date.
- Astro, Cloudflare, and relevant open-source attribution.
- GitHub, LinkedIn, Brown email, and personal email.
- Back-to-top link outside the right rail on desktop, inside the footer row when
  the viewport has no room for a gutter. Keep the theme toggle in the header only.
- Align build metadata, Privacy, and Back to top with shared 40px control heights
  and 20px line heights, including mobile layouts.
- Explicit attribution: "Design system inspired in part by chanhdai.com" with a link.

The static homepage phase first completes navigation for the existing public
routes and adds this shared footer. Homepage section anchors arrive with their
target sections; menu and search controls arrive with their functional behavior.
The header uses the existing theme controller and one live status region.
Build metadata uses a UTC build date and an optional validated public
`GITHUB_SHA`; no Git command or browser request is required. Contact values remain
deferred to the environment-backed contact phase.

## 6. Visual design system

### 6.1 Layout

- Main rail maximum width: 768 px.
- Wide hero bleed: up to 960 px on large screens, while identity text remains in the 768 px rail.
- The outer blueprint page panel owns one continuous pair of 1 px vertical
  rails, spanning the header and content and at least the full viewport height.
  Nested panels share those rails; horizontal dividers never add vertical borders.
- Blueprint rails, horizontal rules, and hatching use 12% ink opacity in both
  themes for a faint sketch treatment, controlled by `--color-blueprint-rule`.
- Panels compose as vertical stacks, including nested stacks. Each physical
  horizontal seam has one paint owner, including adjacent panels, paired rule
  bands, striped dividers, and stacks with decorative overlays or hidden sections.
- Section boundaries align to a shared 8 px spacing grid.
- Main page title/description blocks end with `StripeSeparator` followed directly
  by `PanelRuleBand` before content or metadata, using shared border ownership.
- Mobile side padding: 20 px.
- Desktop section spacing: 72-96 px depending on content density.
- Text line length in prose: approximately 68 characters.

### 6.2 Light-theme tokens

```css
:root {
  color-scheme: light;
  --color-paper: #fcf3e6;
  --color-surface: #f5e8d6;
  --color-surface-raised: #fffaf3;
  --color-ink: #38332f;
  --color-muted: #38332f;
  --color-brass: #38332f;
  --color-brass-soft: #e7d6be;
  --color-rule: rgb(56 51 47 / 18%);
  --color-blueprint-rule: rgb(56 51 47 / 12%);
  --color-rule-strong: rgb(56 51 47 / 32%);
  --color-overlay: rgb(43 39 36 / 25%);
  --color-focus: #38332f;
  --color-danger: #923b33;
  --color-danger-emphasis: #96372f;
  --color-on-danger: #fcf3e6;
}
```

### 6.3 Dark-theme tokens

```css
[data-theme="dark"] {
  color-scheme: dark;
  --color-paper: #2b2724;
  --color-surface: #332e2a;
  --color-surface-raised: #38322d;
  --color-ink: #ae9877;
  --color-muted: #ae9877;
  --color-brass: #ae9877;
  --color-brass-soft: #4a4033;
  --color-rule: rgb(174 152 119 / 18%);
  --color-blueprint-rule: rgb(174 152 119 / 12%);
  --color-rule-strong: rgb(174 152 119 / 32%);
  --color-overlay: rgb(0 0 0 / 50%);
  --color-focus: #ae9877;
  --color-danger: #b98279;
  --color-danger-emphasis: #82443d;
  --color-on-danger: #e7d6be;
}
```

Theme behavior:

- Default to the operating-system preference on first visit.
- Store an explicit visitor choice in `localStorage`.
- Apply an inline, CSP-compatible bootstrap before paint to avoid a theme flash.
- Update `color-scheme` and `theme-color` metadata.
- Both themes must meet WCAG AA contrast for normal text and visible focus indicators.
- Command inputs use a focus line along the search row instead of a rectangular
  input outline, retaining a visible keyboard cue in both themes and forced colors.

### 6.4 Typography

- Display headings: Geist Sans, self-hosted variable WOFF2.
- Body: IBM Plex Sans, self-hosted variable WOFF2.
- Technical metadata and code-adjacent UI: IBM Plex Mono.
- Decorative annotations and the footer sign-off: Caveat, self-hosted through Fontsource.
- Rail annotations: 20 px at 45% opacity, including their arrows.
- The approved faint rail annotations are a decorative contrast exception; do not
  rely on them for essential instructions. Duplicate interaction guidance in the
  instrument's accessible description. Automated contrast scans explicitly omit
  these decorative overlays while continuing to check the surrounding interface.
- Use no more than these four role-specific font families. Handwritten text must
  remain decorative and cannot carry essential instructions or content.
- Body: 16 px/1.65.
- Metadata: 12-13 px/1.45.
- Hero heading: fluid 40-64 px, restrained rather than oversized.
- Section headings: 22-28 px with compact annotations.

### 6.5 Motion

- Default durations: 120 ms for control feedback, 220 ms for disclosure, 350-500 ms for section entrances.
- Prefer opacity and transforms; avoid layout-triggering animation.
- Do not animate every element on scroll.
- `prefers-reduced-motion: reduce` disables decorative motion, replaces spring effects with immediate state changes, and keeps essential state feedback.
- Stop animation when components are offscreen or `document.visibilityState !== "visible"`.

## 7. Guitar widget engineering specification

### 7.1 Component boundary

Use a single React island:

```text
HeroGuitar.astro
└── GuitarStrings.tsx (client:visible)
    ├── interaction/string-crossing.ts
    ├── interaction/string-physics.ts
    ├── audio/guitar-engine.ts
    └── guitar-strings.css
```

React owns lifecycle, controls, status text, and SVG structure. Per-frame pointer and string state lives in refs/plain objects, not React state.

### 7.2 String model

| Index | Physical string | Fret | Sounding note | Gauge (inches) | Visual width (approx.) |
| ---: | --- | ---: | --- | ---: | ---: |
| 0 | High E (string 1, top) | 4 | `A♭4` | .012 | 0.7 px |
| 1 | B | 6 | `F4` | .016 | 0.933 px |
| 2 | G | 6 | `D♭4` | .024 | 1.4 px |
| 3 | D | 4 | `G♭3` | .032 | 1.867 px |
| 4 | A | 6 | `E♭3` | .042 | 2.45 px |
| 5 | Low E (string 6, bottom) | 6 | `B♭2` | .053 | 3.092 px |

Use the E♭m11/B♭ chord shape `664664` on a standard-tuned guitar. From bass to
treble, the exact degrees are `5–1–♭3–♭7–9–11`, with E♭ as the root. `voicing.ts` owns the chord name,
frets, standard open-string pitches, and gauges; derive sounding pitches and
note labels there so the SVG and every audition bank agree. Keep sample source
pitches intact and transpose at playback time rather than regenerating assets.

Derive each stroke width from `0.7 × gauge / .012`, keeping the thinnest string
as the visual baseline. Use non-scaling SVG strokes to preserve these widths
across responsive layouts.

Each visible string has a separate transparent interaction hit area of approximately 16-20 px. The hit area must not change the visual thickness.

### 7.3 Interaction state machine

States:

- `muted`: visual interaction works but no audio is produced.
- `ready`: audio context has been unlocked; instrument is not armed.
- `armed`: the primary mouse button, pen, or touch is held over the instrument.
- `playing`: one or more strings are decaying visually and/or audibly.
- `suspended`: tab hidden, window blurred, or widget offscreen.
- `error`: audio could not start; visual behavior remains usable.

Transitions:

- Initial state is muted.
- Clicking unmute creates and resumes a native audio context in the user gesture,
  then dynamically loads Tone.js and the selected recordings before moving to ready.
- Primary `pointerdown` within the instrument moves ready/muted to armed and captures that pointer.
- `pointerup`, cancellation, lost capture, window blur, visibility change, component unmount, or pointer leaving the active region disarms safely.
- Key repeat must not retrigger notes.
- Clicking or tapping a string's hit area plucks it once on release. Allow
  6 CSS pixels of movement for a steady click, independent of the SVG scale.
  Moving farther starts a held-pointer strum; retain crossings from the press
  point and never add a release pluck after dragging, even if the pointer
  returns to its starting point. Cancellation discards pending clicks.

### 7.4 Crossing and strum algorithm

Track the previous and current pointer samples in SVG-local coordinates.

Intersect the pointer segment with each finite string segment in SVG-local
coordinates. This works at any string tilt. Ignore intersections at the start
of the pointer segment to avoid counting a shared sample twice.

Additional constraints:

- The interpolated crossing X coordinate must be within the playable string span.
- Ignore very small movements parallel to a string.
- Require armed state.
- Apply a 35-50 ms per-string cooldown to suppress pointer jitter.
- Calculate crossing fraction `t` along the pointer segment.
- Sort all strings crossed in the same pointer event by `t`.
- Trigger notes in sorted order with tiny offsets derived from event timing so a six-string gesture sounds like a strum, not a block chord.
- Map pointer velocity to clamped visual amplitude. Audio uses a gentler
  independent curve: `max(.15, min(1, velocity / 3) ** 1.35)`, with velocity in
  SVG units/ms. Full audio strength requires a faster gesture than full visual
  displacement, and selecting another recording bank never changes the motion.
- Map crossing direction to the initial visual displacement direction.

Unit-test the crossing function independently from React and the DOM.

### 7.5 Visual physics

For each active string, render a damped fundamental mode with fixed endpoints:

```text
displacement(x, time) =
  amplitude * exp(-decay * time) * sin(frequency * time) * sin(pi * x / length)
```

Implementation choices:

- Approximate each path with 24-40 points; six paths remain inexpensive.
- Keep strum displacement restrained while retaining its speed response. Direct
  click, tap, and keyboard plucks use a gentler fixed impulse than a fast strum.
- Run one `requestAnimationFrame` loop for all strings.
- Stop the loop when every amplitude falls below an epsilon.
- Do not use Anime.js for per-frame string physics.
- Under reduced motion, replace oscillation with a short color/opacity pulse.

### 7.6 Tone.js audio graph

- Dynamically import Tone.js and fetch recordings only when unmute is selected.
- Never start audio before an explicit visitor action.
- Use recorded acoustic notes voiced as `B♭2 E♭3 G♭3 D♭4 F4 A♭4` (E♭m11/B♭),
  selected by string and gesture strength. Alternate recorded takes where available.
- Schedule each note with `ToneBufferSource`; independent strings can overlap,
  while a new pluck damps the previous note on that string.
- Route instruments through a shared gain node and conservative limiter.
- Keep default output lower than typical system volume; avoid startling visitors.
- Ramp gain for mute/unmute to avoid clicks.
- Dispose every Tone node when the island unmounts.
- Do not store or record microphone/audio data.

The user selected Quartertone's Yamaha Eterna recordings for the homepage. Keep
the development-only `/lab/guitar` comparison, defaulting to that selection, with
Shinyguitar's acoustic archtop microphone recordings, FreePats FSS steel-string
recordings, Quartertone's classical guitar, and the University of Iowa guitar
available. All use the same playback path,
six-note phrase, and down/up strums. One gain trim per library preserves its internal
dynamics; Shinyguitar has four strength layers and two alternate takes in the
audition, while FSS has one or two layers per target note. Quartertone uses four
strengths per open string, using public compressed previews with faded endings.
Omit its strongest fifth tier and remap the remaining layers across all MIDI
velocities. Preserve the previous whole-bank gain trim rather than boosting
the quieter set. Only its 24 samples ship in production; dynamically import the
bank and Tone.js on sound activation. The other banks remain entirely in the lab.
Iowa has three dynamics, isolated from its scales and filtered below 30 Hz to
remove subsonic rumble. There is no reverb or sustain looping. Preserve sample licenses
and provenance, with public Quartertone credit and modification details on the
privacy page. Blur/offscreen stop current notes; mute, page exit, and unmount
release audio resources. Activation does not play a demonstration note.

### 7.7 Accessibility and mobile

- Expose mute state using a real button with `aria-pressed` and a visible tooltip/label.
- Announce audio initialization errors in a polite live region.
- Render each string as a keyboard-focusable logical control in addition to the SVG presentation.
- Accessibility exception to the pointer rule: Enter or Space plucks the focused string, without key-repeat retriggering.
- Touch supports a tap to pluck or a single-finger press and drag to strum, with the same pointer capture and crossing algorithm. Scrolling remains available outside the instrument.
- Never rely on color alone for armed/muted status.
- Keep instructions visible, concise, and updated for the current input modality.

## 8. MDX authoring system

### 8.1 Content collections

The independent writing/project implementation on `codex/fix/ui-maintainability`
supersedes the older diverging content branch. It implements static indexes and
reader routes together, with minimal validated frontmatter, page-owned metadata,
Markdown/MDX narrative, and shared published-entry queries. See `CONTENT.md` for
the currently supported fields. The schema below describes the broader publishing
target; fields such as featured, social images, canonical URLs, series, and
reading-time metadata are introduced alongside their consuming features.

Project pages present numbered records in the index, labeled results on detail
pages, and ordinary section links using the static Line Nav adaptation. Both
writing and projects reuse the current blueprint frame and border ownership.
Technology and topic tags use square brackets around each label.
The website does not host a CV or résumé PDF. Approved biographical facts belong
in the homepage and project content. Initial writing specimens remain drafts
and are visible only through development lab
routes. Filtering and the richer MDX feature set remain later work.

Designated navigation and content links use a reusable sketch underline: varied,
repeatable pen gestures in the text color at 72% opacity. A small native custom
element enhances static labels with a mark for each wrapped line, caching paths
and recalculating only when layout/text/fonts change. Marks have enough vertical
room for long labels. A quick CSS stroke transition draws on hover and retraces
backward on pointer exit, reversing smoothly if interrupted. No sketch appears by
default or for the current page. Keyboard focus retains its native outline;
reduced motion makes changes immediate. Native underlines remain the no-JavaScript
and forced-colors fallback. This requires no React hydration or animation dependency.

Create a `blog` collection in `src/content.config.ts` with a strict schema:

```ts
{
  title: string;
  description: string;
  publishedAt: Date;
  updatedAt?: Date;
  tags: string[];
  draft: boolean;
  featured: boolean;
  image?: string;
  canonicalUrl?: string;
  series?: string;
}
```

Build must fail for invalid frontmatter. Draft entries must never appear in the production collection, feed, sitemap, command palette, or adjacent-post navigation.

### 8.2 Required MDX capabilities

| Capability | Implementation |
| --- | --- |
| Code highlighting | Astro's Shiki integration initially |
| Code title/line emphasis | Add Expressive Code only if the built-in renderer becomes limiting |
| GitHub-flavored Markdown | `remark-gfm` |
| LaTeX math | `remark-math` + `rehype-katex` + locally bundled KaTeX CSS |
| Mermaid | Custom React island with a dynamic `mermaid` import |
| Forms | Typed `<Form>` or specific form components; no arbitrary production submission endpoint in v1 |
| Callouts | Static Astro/MDX component |
| Figures | Static component supporting caption, source, and figure number |
| Tabs | Small React island only when tabs are interactive |
| Interactive demos | Explicit React island imported by the MDX file |

Normal articles may use `.md`. Use `.mdx` only when component imports or JSX are required.

### 8.3 Mermaid rules

- Load Mermaid only on pages containing a diagram.
- Render when visible rather than in the initial bundle.
- Match diagram colors to the active theme.
- Re-render after theme changes.
- Require an accessible caption or adjacent textual explanation.
- Preserve the source text in the document for no-JavaScript fallback when practical.

### 8.4 Forms in MDX

The MDX system may render semantic forms, but v1 has no contact form or database-backed submission feature.

If a live form is introduced later:

1. Post to a narrow Astro action or Hono/Worker endpoint.
2. Validate with Zod on the server.
3. Validate a Cloudflare Turnstile token server-side.
4. Add endpoint-specific rate limiting.
5. Add a honeypot and minimum-submit-time heuristic.
6. Do not put third-party API secrets in client code.
7. Return accessible inline errors and a non-JavaScript-compatible result.

## 9. Framework and package plan

### Runtime dependencies

- `astro`
- `@astrojs/react`
- `@astrojs/mdx`
- `react`
- `react-dom`
- `tailwindcss`
- `@tailwindcss/vite`
- Small shadcn dependencies required by chosen components only
- `animejs`
- `tone`
- `remark-gfm`
- `remark-math`
- `rehype-katex`
- `katex`
- `mermaid`
- `zod`

Do not install an icon pack larger than necessary. Prefer a small Lucide subset or local SVG components.

### Development dependencies

- TypeScript
- ESLint with Astro and React support
- Prettier with Astro and Tailwind plugins
- `@astrojs/check` for Astro and TypeScript validation
- Vitest with a DOM environment and V8 coverage
- Playwright with Axe integration for browser and accessibility checks
- A lightweight Git hook runner plus lint-staged checks after the core scripts are stable
- Wrangler when Cloudflare preview and deployment work begins in Phase 5

Pin the Node.js version in `.nvmrc` and `package.json#engines`, pin pnpm in `package.json#packageManager`, and commit the pnpm lockfile. Use Corepack to activate the pinned package manager. Avoid floating dependency versions in CI.

### Developer command contract

The project must expose stable commands so local development, Git hooks, CI, and documentation use the same entry points:

- `pnpm dev`, `pnpm build`, and `pnpm preview` for the Astro lifecycle.
- `pnpm check`, `pnpm lint`, `pnpm lint:fix`, `pnpm format`, and `pnpm format:check` for static quality checks.
- `pnpm test`, `pnpm test:watch`, and `pnpm test:coverage` for unit and component tests.
- `pnpm test:e2e`, `pnpm test:e2e:ui`, and `pnpm test:e2e:update` for browser tests and intentional screenshot updates.
- `pnpm verify` for the fast required local and pull-request checks.
- `pnpm verify:full` for the complete production build and browser suite before review or merge.
- `pnpm cf:preview` for the local Cloudflare-runtime preview once Wrangler is introduced in Phase 5.

`README.md` provides the shortest path to a running site. `DEVELOPMENT.md` explains every command, environment variable, test layer, debugging path, Git hook, and CI equivalent. Later phases add `CONTENT.md` for authoring and `DEPLOYMENT.md` for Cloudflare preview, release, rollback, and operations. Commands must be tested before they are documented as working.

### shadcn/ui component budget

Start with only:

- Button
- Tooltip
- Badge
- Separator
- Collapsible
- Dialog or Sheet
- Command

Do not install a full registry. Keep the curated shadcn-compatible primitives as
React source so their composition API stays familiar and reusable. Astro renders
any React primitive used without a `client:*` directive to static HTML with no
client runtime. When interaction is required, hydrate the feature composition
island (for example, one command-menu island) rather than each primitive.

## 10. Proposed source structure

```text
.
├── .github/
│   ├── workflows/
│   └── pull_request_template.md
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── public/
│   ├── fonts/
│   ├── images/
│   ├── _headers
│   └── robots.txt
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── content/
│   │   ├── layout/
│   │   ├── mdx/
│   │   └── ui/
│   ├── content/
│   │   ├── blog/
│   │   └── projects/
│   ├── data/
│   │   ├── experience.ts
│   │   ├── profile.ts
│   │   └── research.ts
│   ├── islands/
│   │   ├── command-menu/
│   │   ├── guitar/
│   │   ├── mermaid/
│   │   └── theme/
│   ├── layouts/
│   ├── pages/
│   │   ├── writing/
│   │   ├── projects/
│   │   └── index.astro
│   ├── styles/
│   │   ├── global.css
│   │   ├── prose.css
│   │   └── tokens.css
│   ├── content.config.ts
│   └── env.d.ts
├── tests/
│   ├── e2e/
│   └── unit/
├── .env.example
├── .nvmrc
├── AGENTS.md
├── CONTENT.md
├── DEPLOYMENT.md
├── DEVELOPMENT.md
├── IMPLEMENTATIONS.md
├── PLAN.md
├── README.md
├── astro.config.mjs
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vitest.config.ts
└── wrangler.jsonc
```

## 11. Email privacy and bot strategy

### 11.1 Reality and policy

A public email that remains visible to humans cannot be made impossible for a determined browser bot to read. The goal is to defeat basic harvesters, avoid unnecessary duplicate exposure, and challenge abusive automation without hiding the public portfolio from legitimate discovery.

Do not protect the entire site with Cloudflare Access. That would make the portfolio effectively private and prevent normal search indexing.

### 11.2 Email handling

Display:

- Brown email supplied separately through `SITE_EMAIL_BROWN`.
- Personal email supplied through `SITE_EMAIL_PERSONAL`.

Implementation:

1. Enable Cloudflare Email Address Obfuscation for the production hostname.
2. Render both as normal, accessible links so Cloudflare can transform them at the edge.
3. Add copy buttons that copy the decoded human-visible address after the page has loaded.
4. Do not include either address in JSON-LD, RSS, `robots.txt`, `llms.txt`, OG metadata, image alt text, or client-side configuration objects.
5. Keep the addresses out of source control by supplying them as build-time environment variables in CI and an ignored `.env.local` file locally. They will still exist in final HTML, where Cloudflare performs the edge transformation, but will not be trivially harvested from the public Git repository.
6. Never expose email values through a JSON endpoint because Cloudflare's HTML email obfuscation does not transform JSON.
7. Do not set `Cache-Control: no-transform` on HTML because that disables Cloudflare's email transformation.
8. Verify the deployed HTML from an external request and confirm the raw response does not contain the plain addresses.

Cloudflare documents that this transformation does not apply to HTML/JavaScript specifically generated by Worker code. The v1 static-asset architecture avoids that limitation; if contact markup later moves into an SSR route, replace this protection with an explicit reveal endpoint or another reviewed mechanism.

On September 7, 2026, the user withdrew the earlier decision to host their résumé.
Do not include a résumé PDF, CV route, redirect, or download link in the site.
The former `/cv` and `/cv.pdf` URLs return 404, and the build contains no résumé
asset. Keep private contact values out of source and metadata.

### 11.3 Crawler policy

Default launch policy:

- Allow verified major search-engine crawlers.
- Allow link-preview and social-card crawlers.
- Publish an explicit `robots.txt` and sitemap.
- Disallow known AI training crawlers in `robots.txt`.
- Enable Cloudflare's Block AI Bots setting if Sky wants enforcement beyond voluntary `robots.txt` compliance.
- Do not enable blanket Bot Fight Mode at launch unless traffic demonstrates a need; on lower plans it is coarse and difficult to exempt per-route.
- Rely on Cloudflare's always-on network DDoS protections.

`robots.txt` is advisory and will not stop malicious scrapers. It is a policy signal, not a security control.

### 11.4 Future write-endpoint protection

If forms or APIs are added:

- Use Cloudflare Turnstile Managed mode.
- Verify tokens on the server; client-only validation is insufficient.
- Apply a route-specific rate-limit rule to `POST` endpoints.
- Use CSRF-resistant same-site cookies if sessions are ever introduced.
- Log outcomes without logging message content, email values, or Turnstile secrets.
- Return identical outward behavior for likely spam to avoid giving attackers a classification oracle.

## 12. Security headers

Create `public/_headers` with a tested baseline:

- `Content-Security-Policy`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy` disabling camera, microphone, geolocation, and other unused features
- `Cross-Origin-Opener-Policy: same-origin`
- `frame-ancestors 'none'` through CSP
- Long immutable caching for hashed Astro assets
- Short revalidation for HTML, feeds, and sitemaps

CSP requirements:

- Self-host fonts.
- Prefer local assets.
- Account for Cloudflare's email decode script.
- If Turnstile is later added, explicitly allow only the documented Cloudflare challenge origins.
- Avoid `'unsafe-eval'` and broad wildcard origins.
- Theme initialization should use a nonce/hash-compatible inline strategy or an external early script.

## 13. Cloudflare deployment architecture

### v1

```text
Git repository
  -> CI checks
  -> Astro static build (`dist/`)
  -> Wrangler deploy
  -> Cloudflare Workers Static Assets
  -> Custom domain proxied by Cloudflare
```

- Do not install `@astrojs/cloudflare` solely for static hosting.
- Configure Wrangler assets to point to `./dist`.
- Use static `404.html` handling, not SPA fallback.
- Enable preview deployments from pull requests if the chosen CI workflow supports them cleanly.
- Production deploys only from the protected main branch.
- The approved early preview uses a separate `sky-lu-website-preview` Worker on
  `workers.dev`, deployed explicitly from the current homepage feature branch.
  It has no custom-domain route; preview responses discourage indexing.
- Recordings use the existing R2 bucket at `audio.skylu.me`, independently of
  website deployment. The browser requests public audio directly, without a
  Worker binding. Retired root-domain recording paths return 404, without redirects.

### Not used in v1

- Durable Objects
- KV
- D1
- Access
- SSR
- Hono API
- Astro sessions

Add these only for a concrete feature. Likely future mapping:

| Need | Product |
| --- | --- |
| Large personal audio/image library | R2 |
| Contact/newsletter form storage | D1 or external mail provider |
| Read-heavy global configuration | KV |
| Real-time collaborative instrument | Durable Objects |
| Private editorial preview | Access |
| Substantial API surface | Hono Worker or Astro endpoints |

## 14. Source maps, logging, and monitoring

### Launch

- Enable Cloudflare Workers/asset deployment logs.
- Set `upload_source_maps: true` when a Worker runtime is introduced.
- Produce client source maps during CI but do not expose ordinary public `.map` files.
- Monitor Core Web Vitals and uncaught client errors locally during development.
- Do not add invasive session replay or behavioral tracking.

### Phase 2

Add Sentry when the first public interactive version is stable enough to produce actionable signals:

- Upload hidden client source maps keyed to the deployment commit.
- Capture errors from the guitar, command palette, Mermaid rendering, and route transitions.
- Redact email addresses and content from event payloads.
- Use low sampling and no session replay by default.

## 15. Testing strategy

### Unit tests with Vitest

- Pointer segment crossing one string.
- Pointer segment crossing several strings in both directions.
- Correct ordering by crossing fraction.
- Movement parallel to a string does not trigger.
- Crossing outside the playable span does not trigger.
- Per-string cooldown suppresses jitter.
- Velocity-to-amplitude mapping clamps correctly.
- Pointer arming resets on release, cancellation, blur, visibility change, and unmount.
- No global keyboard arming shortcut is installed.
- Content schemas reject invalid dates, missing descriptions, and malformed tags.
- Draft filtering excludes content from all production indexes.

### Browser tests with Playwright

- Homepage renders and remains navigable with JavaScript disabled.
- Theme initializes without a flash and persists after reload.
- Unmute requires an explicit click.
- Holding the primary pointer and crossing one string produces one instrument event.
- Crossing several strings produces ordered events.
- Moving without holding the primary pointer does not pluck.
- Typing into a form does not arm the guitar.
- Single-finger touch strumming works without scrolling the instrument.
- Reduced-motion mode disables decorative animation.
- Command palette finds routes and posts.
- Mermaid and math render in both themes.
- 404, RSS, sitemap, and canonical metadata are correct.
- External email response is obfuscated in production.

Audio assertions should test calls and scheduling rather than microphone output.

### Accessibility checks

- Axe scan for core pages.
- Full keyboard path through navigation, disclosures, command menu, theme control, and guitar fallback.
- Visible focus in both themes.
- No keyboard trap in command palette or mobile menu.
- Correct heading order and landmarks.
- Figure captions connected to figures.
- Sufficient contrast for brass accents.

### Performance budgets

- Static pages without interactive embeds: minimal client JavaScript.
- Homepage initial client JavaScript target: under 100 KB gzip before Tone.js is requested.
- Tone.js must be split into a lazy chunk.
- Mermaid must never load on a page without a diagram.
- No layout shift from fonts, portrait placeholder, or guitar initialization.
- Aim for Lighthouse 95+ performance/accessibility/best-practices/SEO on representative pages, without treating the score as the only quality signal.

## 16. CI pipeline

On every pull request:

1. Install with frozen pnpm lockfile.
2. Run `pnpm verify` for formatting, lint, Astro/TypeScript validation, unit tests, and the production build.
3. Run the Playwright smoke and accessibility suite against the production build.
4. Upload failure-only browser artifacts that help reproduce a failed run.
5. Add a Lighthouse budget check after the UI stabilizes.

On main:

1. Repeat all required checks.
2. Build with contact emails supplied through CI secrets.
3. Deploy with Wrangler.
4. Run post-deploy smoke tests against the custom domain.
5. Verify email obfuscation, headers, sitemap, and build identifier.

## 17. Implementation phases

### Phase 0 - Repository foundation

- Scaffold Astro with TypeScript strict mode and the pinned Node.js and pnpm versions.
- Add React, MDX, Tailwind v4, ESLint, Prettier, Vitest, Playwright, Axe, and coverage tooling.
- Establish the complete local command contract, including `verify` and `verify:full`.
- Add CI, a pull-request template, and small pre-commit checks that reuse package scripts.
- Add optional VS Code recommendations and workspace settings without making one editor mandatory.
- Add `README.md`, `DEVELOPMENT.md`, and `.env.example` without real email values.
- Preserve unrelated `.opencode/` files.

Acceptance:

- A new contributor can follow the quick start from a clean checkout and reach the local site without undocumented steps.
- `pnpm verify` and `pnpm verify:full` pass, including a production-build browser smoke test and accessibility check.
- Local hooks and CI invoke the documented package scripts rather than maintaining separate command logic.
- Deployment remains intentionally out of scope until the Cloudflare phase.

### Phase 1 - Design system and shell

- Implement tokens, light/dark themes, typography, rail/grid layout, header, footer, separators, badges, and buttons.
- Add theme persistence without flash.
- Create `/lab` specimens.
- Port only necessary shadcn components.

Acceptance:

- Both themes pass contrast checks.
- Responsive at 360, 768, 1024, and 1440 px.
- No React hydration for the static shell.

### Phase 2 - Content model and primary pages

- Add typed profile, education, experience, research, and project data.
- Create home, writing index, and project index routes.
- Create MDX collection and one fixture article demonstrating code, math, Mermaid, figure, and callout.
- Add RSS, sitemap, robots, canonical metadata, and JSON-LD without email addresses.

Acceptance:

- Invalid frontmatter fails the build.
- Draft content is absent from production artifacts.
- No Mermaid or Tone.js in unrelated page bundles.

### Phase 3 - Homepage interactions

- Build the original network figure in the research section.
- Add command palette and searchable content index.
- Add expandable experience/project rows.
- Apply restrained Anime.js motion and reduced-motion behavior.

Acceptance:

- Homepage works without JS.
- Interactions are keyboard accessible.
- Initial JS remains within budget.

### Phase 4 - Guitar widget

- Replace the hero's static six-string placeholder with the interactive React island.
- Implement pure crossing geometry and tests.
- Implement six SVG strings and damped visual physics.
- Implement primary-pointer capture and arming state machine.
- Implement Tone.js lazy loading and the selected recorded acoustic sample bank.
- Implement ordered strums, mute control, error handling, mobile fallback, and keyboard fallback.

Acceptance:

- No sound before explicit unmute.
- No note without armed pointer crossing on desktop.
- Single and multi-string interactions are deterministic.
- Audio nodes and animation frames are cleaned up.
- Reduced motion, touch, and keyboard paths work.
- The guitar remains the hero's primary interactive figure at every supported viewport.

### Phase 5 - Cloudflare production hardening

- Configure Workers Static Assets and custom domain.
- Add security/cache headers.
- Enable Cloudflare Email Address Obfuscation.
- Configure crawler policy and optional Block AI Bots.
- Add deployment-time email secrets.
- Add external post-deploy verification.

Acceptance:

- Plain emails are absent from the public repository and raw Cloudflare-served HTML.
- Search engine indexing remains available.
- Headers and caching behave as designed.
- Production deploy is reproducible from main.

### Phase 6 - Polish and launch

- Replace portrait placeholder when photograph is supplied.
- Add real writing and project links.
- Verify public claims and outbound links.
- Run accessibility, responsive, performance, and Safari/iOS audio tests.
- Add Sentry only if launch testing demonstrates enough client-runtime surface to justify it.

## 18. Content and privacy checklist before launch

- Confirm the exact public title for the ATLAS relationship.
- Obtain the canonical public URL for Tundra, if one exists.
- Confirm spelling and preferred capitalization: `Sky Lu`.
- Confirm personal pronouns, or omit them.
- Keep GPA values out of the public site.
- Confirm that company metrics remain approved for publication.
- Confirm that the retired résumé asset and download routes remain absent.
- Confirm final Brown email value through a build secret.
- Add photograph with explicit crop/focal-point instructions and descriptive alt text.
- Check every third-party logo's usage policy before adding logo artwork; text links do not require logo assets.

## 19. Deferred decisions

- Final domain name.
- Final photograph and portrait treatment.
- Canonical Tundra repository/project link.
- Whether known AI training crawlers should be blocked at the Cloudflare level or only discouraged in `robots.txt`.
- Whether future contact uses direct email only or a Turnstile-protected form.
- Whether to add privacy-preserving analytics after launch.

None of these block the initial scaffold.

## 20. References

- Chanhdai repository: https://github.com/ncdai/chanhdai.com
- Chanhdai trademark policy: https://github.com/ncdai/chanhdai.com/blob/main/TRADEMARK.md
- Brown ATLAS Group: https://atlas.cs.brown.edu/
- ATLAS team: https://atlas.cs.brown.edu/team/
- Astro islands: https://docs.astro.build/en/concepts/islands/
- Astro content collections: https://docs.astro.build/en/guides/content-collections/
- Astro MDX: https://docs.astro.build/en/guides/integrations-guide/mdx/
- Cloudflare Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Cloudflare Email Address Obfuscation: https://developers.cloudflare.com/waf/tools/scrape-shield/email-address-obfuscation/
- Cloudflare bot feature interoperability: https://developers.cloudflare.com/waf/feature-interoperability/
- Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/
- Cloudflare form and rate-limit guidance: https://developers.cloudflare.com/use-cases/solutions/stop-malicious-bots/
- Anime.js React integration: https://animejs.com/documentation/getting-started/using-with-react/
- Tone.js: https://tonejs.github.io/
- Tone.js sample playback: https://tonejs.github.io/docs/15.1.22/classes/ToneBufferSource.html
