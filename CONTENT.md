# Content authoring

Content is authored in Markdown or MDX and rendered during the Astro build.
The public routes are `/writing`, `/writing/[slug]`, `/projects`, and
`/projects/[slug]`. Reading and navigation work without JavaScript. A small shared
enhancement adds sketch underlines to designated link labels.

## Add an article

Create a file directly inside `src/content/blog/`, for example
`my-first-note.md`. The filename becomes `/writing/my-first-note`.

```yaml
---
title: My first note
description: A concise explanation of what the reader will learn.
publishedAt: 2026-09-06
tags: [Engineering notes]
draft: true
---
```

Write the body below the frontmatter. Start body sections at `##`; the reading
layout supplies the page's `h1`. Second-level headings automatically populate
the “On this page” navigation when there is more than one. Third-level headings
remain available for subsections. Heading targets clear the sticky header.

`updatedAt` is optional and cannot precede `publishedAt`. Dates render in UTC.
Every entry requires an explicit `draft` value. Drafts are excluded from public
paths, indexes, and next-entry navigation in both development and production.
Change `draft` to `false` only when the article is ready for review and publication.
Entries sort newest first, with filename order resolving equal dates.

The initial article is a draft layout specimen. Review it at
`/lab/content/article`; `/lab/content/writing` shows sample index rows. Both routes
exist only in development and carry noindex metadata. The public writing index
has an empty state until an actual article is published.

## Add a project

Create a Markdown or MDX file directly inside `src/content/projects/`.
The filename supplies `/projects/[slug]`. A project uses:

```yaml
---
title: Project name
description: One sentence describing the work.
category: Independent
context: Systems project
order: 5
tags: [Rust, Network systems]
draft: true
results:
  - value: Measured result
    label: What was measured
---
```

Category is `Engineering`, `Research`, or `Independent`. `order` is a nonnegative
integer; lower numbers appear first. Each project has one to three labeled
results. The first result appears in the index; all results appear on the detail
page. Keep metric labels specific about what was measured.

The four initial projects use facts from the supplied résumé and the confirmed
ATLAS description in `PLAN.md`. Their prose is an editable summary, not a claim
that a repository, paper, or public benchmark exists. Add external links only
when their actual destinations are supplied or verified. Never put private
contact values in article or project content. The separately approved PDF CV
follows the publication workflow below.

## Update the PDF CV

`public/cv.pdf` is the original `Sky Lu Resume (14).pdf`, published verbatim at the
user's explicit request on September 6, 2026. The global CV link opens `/cv.pdf`
directly in the browser's PDF handler. `/cv` is an Astro static redirect to that
asset; it uses an HTML refresh in the static build and requires no JavaScript.

Replace the asset with the approved original file to update the CV. Do not
rebuild it from HTML, re-export it, compress it, or change its metadata. Keep the
public filename stable so existing links continue to work. The browser tests
compare the served and built bytes with the source asset.

The PDF's original layout, links, and metadata remain intact. Review replacement
files before publishing; authorization for this supplied version is not blanket
authorization to publish another document's private contact details. Profile data
for the homepage remains separate from the PDF and does not generate it.

## Update public profile data

Small, typed modules in `src/data/` supply public facts to static Astro templates:

- `profile.ts`: name, site description, introduction, GitHub/LinkedIn links, and
  education. Shared navigation and page titles already read the name here.
- `experience.ts`: jobs in newest-first order, with a short summary and one to
  three disclosure bullets per job.
- `research.ts`: the confirmed ATLAS relationship, collaborator link, interests,
  and related project IDs. This wording comes from `PLAN.md`, while education
  and employment details come from the approved résumé.
- `types.ts`: shared public-link and month-precision date types.

Use `YYYY-MM` for dates. Education explicitly distinguishes expected graduation
from completion; experience uses `end: null` for a current role. Update these
facts deliberately rather than changing a visitor's biography based on the clock.
Keep IDs stable when editing display text. The readonly types protect consumers
from accidentally editing shared records; no runtime data library is needed.

`projectIds` refer to filenames in `src/content/projects/` without extensions.
Resolve them against `getProjects()` from `src/content/queries.ts`, and render the
collection's titles, descriptions, results, and tags. Project metrics have one
source. When renaming or unpublishing a project, update its references too; the
isolated build test checks these relationships against Astro's published data.

This data prepares the homepage sections; it does not render an HTML CV or
rewrite the original PDF. GPA values stay in the PDF. Contact values are absent
from these public modules and remain deferred to the environment-backed contact
feature. Do not add an email field, invented research dates, a publication, or a
Tundra repository link without an approved source.

## Layout ownership

`src/content/schema.ts` validates frontmatter. `src/content/queries.ts` owns the
published collection selection and ordering used by both indexes and route
generation. Reuse these queries when feeds or search are implemented.

`ReadingLayout.astro` supplies the page header, metadata area, section links,
prose region, and return/next links. Article and project routes supply their own
metadata through slots. The body remains ordinary Markdown/MDX. The indexes
compose the existing blueprint panels instead of duplicating border rules.
Both the shared index heading and reader header end with `StripeSeparator`
followed immediately by `PanelRuleBand`, separating the title/description block
from the page content or reader metadata. Use these existing components so nested
panels retain one rule per shared edge.
Tag labels render in square brackets on indexes and detail pages. Keep the
frontmatter values plain; the templates supply the brackets.

`src/styles/prose.css` is scoped to `.content-prose` and loaded only by the reader
layout. It handles heading rhythm, lists, quotes, tables, and code overflow.
Astro's existing Shiki renderer produces both light and dark syntax colors at
build time; the page theme selects them with CSS. Code uses the site's warm
surface token. Wide code and tables scroll inside the rail.

Use `<SketchUnderline text="A label" />` from `src/components/blueprint/` inside
an ordinary link or text element to opt into the hand-drawn decoration. Typography
comes from the surrounding element. `seed` optionally supplies a stable identity;
the sketch draws on hover and retraces backward when the pointer leaves. No sketch
is shown by default or for the current page. Leave adjacent icons outside the
component. See `DEVELOPMENT.md` for caching and layout behavior.

MDX can import static components normally. Keep prose inside the reading layout;
do not nest another `BaseLayout` in a content entry. Add an island only when a
specific feature needs browser behavior. Math, Mermaid, rich figures, feeds,
filtering, and reading-time metadata remain later publishing features.

## Validate changes

Run `pnpm check` for content/schema checks and `pnpm verify:full` before a commit
review. Use `pnpm dev` to inspect `/writing`, `/projects`, and the two content lab
routes in both themes and at narrow widths. `pnpm test:lab` includes the content
specimens and the existing reviewed visual targets.

The build regression test publishes sample articles and marks a project as a
draft in an isolated temporary copy. It verifies real generated routes, ordering,
next-entry links, draft exclusion, and build failure for invalid frontmatter.
It never changes the working content files or publishes the sample articles.
