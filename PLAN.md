# Sky Lu Personal Website - Implementation Plan

Status: approved direction, ready for scaffolding
Last updated: 2026-08-21
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
- The guitar supports individual plucks and ordered multi-string strums using the required `F`-key interaction.
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
| Guitar audio | Tone.js synthesized plucks, standard tuning |
| Animation | Anime.js v4 for authored motion; custom `requestAnimationFrame` for string physics |
| Theme | Light and dark themes derived from `#2B2724` and `#A59170` |
| Contact | Display Brown and personal email addresses, supplied as deployment secrets, with anti-harvesting measures |
| Research | ATLAS Group; worked with Nikos Vasilakis; feature Tundra |
| Social features | None in v1 |
| Component workshop | A local `/lab` route, not Storybook initially |
| Monitoring | Cloudflare observability at launch; Sentry after the first public interactive release |
| Photograph | Reserved layout slot; real photograph will be uploaded later |

## 3. Inspiration and originality boundary

The homepage may reuse MIT-licensed code patterns from `ncdai/chanhdai.com`, but it must not look like a rebadged copy.

### Patterns to reuse

- Narrow centered document rail.
- Persistent vertical grid lines and horizontal section separators.
- Compact sticky navigation.
- Large technical illustration near the top.
- Small figure captions, annotations, keycaps, metadata, and superscript counts.
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
- IBM Plex Sans and IBM Plex Mono rather than the reference site's Geist identity.
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
| `/cv` | Accessible web résumé | Static |
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

- Sky monogram/home link.
- `Work`, `Research`, `Writing`, and `Jazz` anchor links.
- Command/search button with `Cmd/Ctrl + K` hint.
- GitHub link.
- Theme toggle.

Mobile navigation:

- Monogram/home link.
- Command/search button.
- Menu button opening a shadcn Sheet or Dialog.
- Theme toggle remains directly reachable.

The header is approximately 52 px tall, sticky, and uses a lightly translucent paper background with `backdrop-filter` only where supported.

### 5.2 Hero: interactive six-string guitar

The hero pairs the identity block with the playable guitar. On wide screens, the strings receive the wide visual rail while the identity copy remains compact; on narrow screens, identity, controls, and strings stack without hiding the instrument below another content section. The guitar is the first and primary interactive figure.

Behavior:

- Render a meaningful static six-string SVG before the React island hydrates.
- Show the mute/unmute control and the instruction `Unmute, hold F, then cross one or more strings` immediately beside the instrument.
- Keep Tone.js out of the initial bundle and load it only after explicit unmute.
- Preserve visual plucking while muted, but never produce sound before explicit activation.
- Use the documented reduced-motion, keyboard, and touch alternatives without moving the instrument to another section.
- Do not place a competing pointer-driven network interaction in the hero.

Proposed figure caption:

> Fig. 1. Six strings, tuned E-A-D-G-B-E. Unmute, hold F, and cross a path to play.

### 5.3 Hero identity block

Initial copy:

> # Sky Lu
>
> Computer science master's student at Brown. I build fast distributed systems and AI infrastructure - and play jazz guitar.

Compact identity labels:

- Brown M.S. CS '27
- Software Engineer
- Network Systems Researcher
- Jazz Guitarist

Primary links:

- Read my writing
- Explore projects
- GitHub
- Résumé / CV

Reserve a portrait slot that can initially contain an abstract monogram or neutral placeholder. Do not fabricate a face or use a stock portrait.

### 5.4 Overview

Use compact metadata rows:

| Label | Value |
| --- | --- |
| Studying | M.S. in Computer Science, Brown University, expected May 2027 |
| Research | ATLAS Group, network and distributed systems |
| Advisor/collaborator | Nikos Vasilakis |
| Previously | Cloudflare, Z.ai, Flowith, QuantInfinite |
| Background | B.A. in Computer Science and Mathematics, Carleton College |
| Contact | Brown email and personal email |

Draft introduction:

> I am a software engineer and systems researcher interested in what happens between an application and the infrastructure beneath it: network protocols, edge execution, storage systems, and efficient AI serving. At Brown's ATLAS Group, I worked with Nikos Vasilakis on Tundra, a library for building composable network communication pipelines.

Use the phrase "student researcher in the ATLAS Group" rather than implying a faculty, staff, or Ph.D. appointment.

### 5.5 Selected systems work

Show four editorial project records. Each record has a short summary, measurable outcome, technology tags, and optional details disclosure.

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

Each collapsed row contains company, role, dates, location, and a one-line contribution. Expanded content contains at most three bullets. The full `/cv` route can include every approved résumé bullet.

### 5.7 Research section

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

> Unmute, hold `F`, then cross one or more strings.

The actual mute/unmute control stays beside the hero instrument and always exposes a text label to assistive technology.

### 5.9 Writing

Show the latest three published articles. Each card contains title, summary, publication date, reading time, and tags.

Initial topic taxonomy:

- Network systems
- Distributed systems
- Edge infrastructure
- Efficient AI serving
- Engineering notes
- Jazz and listening

### 5.10 Footer

Include:

- Short site description.
- Git commit/build identifier when available.
- Build date.
- Astro, Cloudflare, and relevant open-source attribution.
- GitHub, LinkedIn, Brown email, and personal email.
- Theme toggle and back-to-top control.
- Explicit attribution: "Design system inspired in part by chanhdai.com" with a link.

## 6. Visual design system

### 6.1 Layout

- Main rail maximum width: 768 px.
- Wide hero bleed: up to 960 px on large screens, while identity text remains in the 768 px rail.
- Rail receives 1 px left and right borders on desktop.
- Section boundaries align to a shared 8 px spacing grid.
- Mobile side padding: 20 px.
- Desktop section spacing: 72-96 px depending on content density.
- Text line length in prose: approximately 68 characters.

### 6.2 Light-theme tokens

```css
:root {
  color-scheme: light;
  --color-paper: #f3efe8;
  --color-surface: #faf7f2;
  --color-surface-raised: #fffdf9;
  --color-ink: #2b2724;
  --color-muted: #706861;
  --color-brass: #a59170;
  --color-brass-soft: #d8ccba;
  --color-rule: rgb(43 39 36 / 14%);
  --color-rule-strong: rgb(43 39 36 / 28%);
  --color-focus: #806b4d;
  --color-danger: #9a4c3f;
}
```

### 6.3 Dark-theme tokens

```css
[data-theme="dark"] {
  color-scheme: dark;
  --color-paper: #211e1b;
  --color-surface: #292521;
  --color-surface-raised: #312c27;
  --color-ink: #eee7dc;
  --color-muted: #aaa096;
  --color-brass: #b9a27f;
  --color-brass-soft: #594d3e;
  --color-rule: rgb(238 231 220 / 12%);
  --color-rule-strong: rgb(238 231 220 / 24%);
  --color-focus: #ccb58e;
  --color-danger: #d17d6e;
}
```

Theme behavior:

- Default to the operating-system preference on first visit.
- Store an explicit visitor choice in `localStorage`.
- Apply an inline, CSP-compatible bootstrap before paint to avoid a theme flash.
- Update `color-scheme` and `theme-color` metadata.
- Both themes must meet WCAG AA contrast for normal text and visible focus indicators.

### 6.4 Typography

- Primary: IBM Plex Sans, self-hosted variable WOFF2 where licensing permits.
- Technical metadata and code-adjacent UI: IBM Plex Mono.
- Use no more than two font families.
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

| Index | Name | Tone.js note | Visual width |
| ---: | --- | --- | ---: |
| 0 | Low E | `E2` | 3.4 px |
| 1 | A | `A2` | 2.8 px |
| 2 | D | `D3` | 2.2 px |
| 3 | G | `G3` | 1.5 px |
| 4 | B | `B3` | 1.0 px |
| 5 | High E | `E4` | 0.7 px |

Each visible string has a separate transparent interaction hit area of approximately 16-20 px. The hit area must not change the visual thickness.

### 7.3 Interaction state machine

States:

- `muted`: visual interaction works but no audio is produced.
- `ready`: audio context has been unlocked; instrument is not armed.
- `armed`: `F` is held while the widget is eligible for pointer interaction.
- `playing`: one or more strings are decaying visually and/or audibly.
- `suspended`: tab hidden, window blurred, or widget offscreen.
- `error`: audio could not start; visual behavior remains usable.

Transitions:

- Initial state is muted.
- Clicking unmute dynamically loads Tone.js, calls `Tone.start()`, creates the audio graph, and moves to ready.
- `keydown` for `F` moves ready/muted to armed unless focus is inside an input, textarea, select, editable element, or dialog text field.
- `keyup`, window blur, visibility change, component unmount, or pointer leaving the active region disarms safely.
- Key repeat must not retrigger notes.
- Pressing `F` while the pointer is already stationary over a string does not trigger it; a geometric crossing is required.

### 7.4 Crossing and strum algorithm

Track the previous and current pointer samples in SVG-local coordinates.

For each horizontal string baseline `y_i`, detect a crossing when:

```text
(previousY - y_i) and (currentY - y_i) have opposite signs
```

Additional constraints:

- The interpolated crossing X coordinate must be within the playable string span.
- Ignore very small movements parallel to a string.
- Require armed state.
- Apply a 35-50 ms per-string cooldown to suppress pointer jitter.
- Calculate crossing fraction `t` along the pointer segment.
- Sort all strings crossed in the same pointer event by `t`.
- Trigger notes in sorted order with tiny offsets derived from event timing so a six-string gesture sounds like a strum, not a block chord.
- Map pointer velocity to a clamped amplitude/volume range.
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
- Run one `requestAnimationFrame` loop for all strings.
- Stop the loop when every amplitude falls below an epsilon.
- Do not use Anime.js for per-frame string physics.
- Under reduced motion, replace oscillation with a short color/opacity pulse.

### 7.6 Tone.js audio graph

- Dynamically import Tone.js when the widget approaches the viewport or when unmute is selected.
- Never start audio before an explicit visitor action.
- Create six `Tone.PluckSynth` instances so notes can overlap.
- Route instruments through a shared gain node and conservative limiter.
- Keep default output lower than typical system volume; avoid startling visitors.
- Tune the six synths to `E2 A2 D3 G3 B3 E4`.
- Vary dampening and resonance slightly by string gauge.
- Ramp gain for mute/unmute to avoid clicks.
- Dispose every Tone node when the island unmounts.
- Do not store or record microphone/audio data.

### 7.7 Accessibility and mobile

- Expose mute state using a real button with `aria-pressed` and a visible tooltip/label.
- Announce audio initialization errors in a polite live region.
- Render each string as a keyboard-focusable logical control in addition to the SVG presentation.
- Accessibility exception to the pointer rule: when a string control is focused, pressing `F` triggers that string.
- On touch devices, replace the unavailable keyboard modifier with a visible press-and-hold `Play` control; dragging while held performs the same crossing algorithm.
- Never rely on color alone for armed/muted status.
- Keep instructions visible, concise, and updated for the current input modality.

## 8. MDX authoring system

### 8.1 Content collections

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

Do not install a full registry. Static visual primitives should be implemented as Astro components when React behavior is unnecessary. A React/shadcn component rendered without a `client:*` directive should remain server-rendered HTML with no client runtime.

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
│   │   ├── cv.astro
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

- Brown email from the résumé, supplied through `SITE_EMAIL_BROWN`.
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

Important limitation: if the supplied résumé PDF is published unchanged, its Brown email can be extracted directly from the PDF and bypasses HTML obfuscation. Prefer the `/cv` web route and later produce a separate public résumé PDF with an explicit privacy decision.

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

### Not used in v1

- Durable Objects
- KV
- R2
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
- `F` state resets on keyup, blur, visibility change, and unmount.
- Focused text inputs suppress the global shortcut.
- Content schemas reject invalid dates, missing descriptions, and malformed tags.
- Draft filtering excludes content from all production indexes.

### Browser tests with Playwright

- Homepage renders and remains navigable with JavaScript disabled.
- Theme initializes without a flash and persists after reload.
- Unmute requires an explicit click.
- Holding `F` and crossing one string produces one instrument event.
- Crossing several strings produces ordered events.
- Moving without `F` does not pluck.
- `F` while typing into a form does not arm the guitar.
- Mobile press-and-hold fallback works.
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
- Create home, writing index, project index, and CV routes.
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
- Implement `F`-key state machine.
- Implement Tone.js lazy loading and six PluckSynth voices.
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
- Confirm whether GPA values belong on `/cv`; do not put them in the hero.
- Confirm that company metrics remain approved for publication.
- Confirm which résumé version, if any, should be downloadable.
- Confirm final Brown email value through a build secret.
- Add photograph with explicit crop/focal-point instructions and descriptive alt text.
- Check every third-party logo's usage policy before adding logo artwork; text links do not require logo assets.

## 19. Deferred decisions

- Final domain name.
- Final photograph and portrait treatment.
- Canonical Tundra repository/project link.
- Whether known AI training crawlers should be blocked at the Cloudflare level or only discouraged in `robots.txt`.
- Whether to publish a downloadable résumé PDF in addition to `/cv`.
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
- Tone.js PluckSynth: https://tonejs.github.io/docs/15.0.4/classes/PluckSynth.html
