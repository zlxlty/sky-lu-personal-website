# Third-party notices

## Guitar samples

`src/lab/assets/guitar/` contains three development-only alternatives. The selected
Yamaha recordings in `src/assets/guitar/` are shared by the homepage and lab:

- **Shinyguitar** by D. Smolken / Karoryfer Lecolds, under CC0 1.0. Acoustic
  microphone samples from revision `57243cca85277dbcc120ce17c6178032f93c80f3`
  of [karoryfer.shinyguitar](https://github.com/sfzinstruments/karoryfer.shinyguitar).
  Four velocity layers and two takes per source pitch were converted from WAV
  to mono MP3. The complete dedication is in `SHINYGUITAR-CC0.txt`.
- **FSS Steel-String Acoustic Guitar**, copyright 2008 Gary Campion;
  modified 2016–2020 by Roberto for FreePats, release 2020-05-21.
  The selected WAVs are unmodified source files under GPLv3 or later, with the
  FreePats composition exception. The original attribution and exception are
  in `FSS-NOTICE.txt`, and the complete GPL is in `FSS-GPL.txt`.
  [Original source and mapping](https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-SFZ-20200521.tar.xz).
- **ClassicalGuitar-multisampled** by **quartertone**, CC BY 4.0. Twenty-four public
  MP3 previews from the [creator's pack](https://freesound.org/people/quartertone/packs/11573/)
  were converted to mono 44.1 kHz with 300 ms tail fades. The strongest fifth tier
  is omitted, and pitches are adjusted for the chord during playback. Full attribution,
  modification details, and terms are in `QUARTERTONE-NOTICE.txt` and
  `QUARTERTONE-CC-BY-4.0.txt`; `scripts/guitar-sources/quartertone.json` lists
  every original sound page and verified download hash.
- **University of Iowa Musical Instrument Samples**, Raimundo 118 guitar
  performed by Brian Penkrot, recorded December 11, 2011. Used under the
  [university's usage permission](https://theremin.music.uiowa.edu/MIS.html).
  The open notes were isolated, filtered below 30 Hz, faded, and converted
  to mono MP3. `IOWA-PERMISSION.txt` preserves credit and processing details;
  `manifest.json` lists source URLs, hashes, and excerpt boundaries.

Only Quartertone's selected subset ships in production; the three alternatives
remain in the development lab. The adjacent READMEs,
manifest, and `scripts/prepare-guitar-samples.ts` describe transformations, pitch
mapping, and reproducible preparation. Upstream attribution files retain their
original third-party contact details.

## Development jazz fixture

`src/lab/assets/jazz-n-brass-demo.mp3` is a compressed version of
**Jazz n' brass loop** by **Emma_MA**, published January 7, 2017 on
[OpenGameArt](https://opengameart.org/content/jazz-n-brass-loop).
The author released the track under
[CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/).

The original `jazznbrass loop.wav` was downloaded from the author's submission
and converted with FFmpeg to 96 kbit/s MP3, with source metadata removed.
The complete 27.44-second loop is retained (330,127 bytes). It is used only in
development, with its actual title and author shown; it is not Julian Lage's
recording. The demo is excluded from production builds.

SHA-256: `27312f8150511b57a9f82b75a16d8550b364c0a76085c68b03df0f18c43833b3`.

## Geist

Display-heading typography is provided by `@fontsource-variable/geist` 5.3.0,
which packages the Geist font by the Geist Project Authors. Geist is licensed
under the SIL Open Font License 1.1; the copyright notice and complete license
are included in `public/fonts/LICENSE.txt`.

## Caveat

Decorative handwritten annotations use Caveat from
`@fontsource-variable/caveat` 5.3.0. Caveat is copyright 2014 The Caveat
Project Authors and is licensed under the SIL Open Font License 1.1; the
copyright notice and complete license are included in `public/fonts/LICENSE.txt`.

## chanhdai.com

Portions of the blueprint layout system are adapted from
[ncdai/chanhdai.com](https://github.com/ncdai/chanhdai.com) at revision
`b0f54ff5a6b40e13fa9a9ce6d3458c7833d50321`.

The migration is limited to general-purpose source code for the document rail,
compact sticky header shell, Panel family, screen-line utilities,
diagonal-stripe separator, rail-aware handwritten annotation, class-name
utility, and the general structure of the curated Base UI-backed control
wrappers. Chánh Đại's name, wordmark, mark geometry, avatar, personal data,
illustrations, and other brand assets are not included.

The static `LineNav` component is additionally adapted from
`src/registry/components/line-nav/line-nav.tsx` at revision
`dc4bf70d7de91bf0531c1897125cfe59d6f1f3e7`, under the same MIT license.
The original credits Devouring Details and Skiper UI. This adaptation uses
ordinary anchors and CSS instead of the original client lifecycle and Motion
dependency, and provides wrapping labels and keyboard focus feedback.

MIT License

Copyright (c) 2026 Chánh Đại

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
