# Self-hosted webfonts

## IBM Plex

These variable WOFF2 files are self-hosted Latin-1 subsets of IBM Plex Sans and
IBM Plex Mono. They were sourced from IBM's official
[`IBM/plex`](https://github.com/IBM/plex) repository at commit
[`bf26009`](https://github.com/IBM/plex/tree/bf260093582f04622aacc1e9f9ca604d7ccd0c42).

The roman and italic files cover weights 100 through 700. The website preloads
the two roman files used above the fold; italic files load only when needed. No
font request leaves the site's origin.

IBM Plex is distributed under the SIL Open Font License 1.1. The complete
license is included in [`LICENSE.txt`](./LICENSE.txt).

## Geist

Display headings use the variable Geist Sans family supplied by
`@fontsource-variable/geist` 5.3.0. Vite bundles the required WOFF2 assets with
the static build, and the Latin file used above the fold is preloaded. No font
request leaves the site's origin.

Geist is distributed under the SIL Open Font License 1.1. The complete license
is included in [`LICENSE.txt`](./LICENSE.txt).

## Caveat

Decorative rail annotations use the variable Caveat family supplied by
`@fontsource-variable/caveat` 5.3.0. Vite emits its Unicode-range WOFF2 subsets
with the static assets, while the browser fetches only a matching subset when a
page renders the handwritten role. Caveat is not globally preloaded, and no
font request leaves the site's origin.

Caveat is distributed under the SIL Open Font License 1.1. The complete license
is included in [`LICENSE.txt`](./LICENSE.txt).
