# Quartertone classical guitar audition

Verified 2026-09-06. The selected subset contains 30 recordings: all five dynamics
for each of the six exact open-string pitches. Quartertone identifies the source
as a Yamaha Eterna classical guitar recorded with a CAD E100 microphone. Filenames
encode fret, physical string, MIDI root, and strength. There are no alternate takes
in this subset. [Creator's pack](https://freesound.org/people/quartertone/packs/11573/).

## Selected recordings and licenses

Every linked sound page was retrieved and independently checked for **CC BY 4.0**;
the table lists all five velocity layers in ascending order. String numbering is
the instrument's numbering, with high E at the top of the audition.

| Screen index | String | Target / recorded MIDI | Fret | v1                                                                | v2                                                                | v3                                                                | v4                                                                | v5                                                                |
| ------------ | ------ | ---------------------- | ---- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| 0            | 1, E4  | 64 / 64                | 0    | [183004](https://freesound.org/people/quartertone/sounds/183004/) | [183003](https://freesound.org/people/quartertone/sounds/183003/) | [183002](https://freesound.org/people/quartertone/sounds/183002/) | [183009](https://freesound.org/people/quartertone/sounds/183009/) | [183008](https://freesound.org/people/quartertone/sounds/183008/) |
| 1            | 2, B3  | 59 / 59                | 0    | [183007](https://freesound.org/people/quartertone/sounds/183007/) | [183006](https://freesound.org/people/quartertone/sounds/183006/) | [183011](https://freesound.org/people/quartertone/sounds/183011/) | [183010](https://freesound.org/people/quartertone/sounds/183010/) | [182943](https://freesound.org/people/quartertone/sounds/182943/) |
| 2            | 3, G3  | 55 / 55                | 0    | [182944](https://freesound.org/people/quartertone/sounds/182944/) | [182941](https://freesound.org/people/quartertone/sounds/182941/) | [182942](https://freesound.org/people/quartertone/sounds/182942/) | [182947](https://freesound.org/people/quartertone/sounds/182947/) | [182948](https://freesound.org/people/quartertone/sounds/182948/) |
| 3            | 4, D3  | 50 / 50                | 0    | [182945](https://freesound.org/people/quartertone/sounds/182945/) | [182946](https://freesound.org/people/quartertone/sounds/182946/) | [182939](https://freesound.org/people/quartertone/sounds/182939/) | [182940](https://freesound.org/people/quartertone/sounds/182940/) | [182962](https://freesound.org/people/quartertone/sounds/182962/) |
| 4            | 5, A2  | 45 / 45                | 0    | [182961](https://freesound.org/people/quartertone/sounds/182961/) | [182964](https://freesound.org/people/quartertone/sounds/182964/) | [182963](https://freesound.org/people/quartertone/sounds/182963/) | [182966](https://freesound.org/people/quartertone/sounds/182966/) | [182965](https://freesound.org/people/quartertone/sounds/182965/) |
| 5            | 6, E2  | 40 / 40                | 0    | [182968](https://freesound.org/people/quartertone/sounds/182968/) | [182967](https://freesound.org/people/quartertone/sounds/182967/) | [182960](https://freesound.org/people/quartertone/sounds/182960/) | [182959](https://freesound.org/people/quartertone/sounds/182959/) | [183059](https://freesound.org/people/quartertone/sounds/183059/) |

Redistribution and adaptation require attribution, a license link, and disclosure
of modifications. Retain the creator, pack and per-file URLs above, and identify
any subsequent fading, transcoding or gain treatment.
[CC BY 4.0 terms](https://creativecommons.org/licenses/by/4.0/).

## Preview acquisition and limitations

Original WAV downloads require Freesound sign-in. Each selected public sound page
also exposes a high-quality MP3 URL in `data-static-file-url`; those exact URLs were
retrieved without login, cookies or API credentials. Freesound documents preview
downloads separately from authenticated original downloads.
[Download documentation](https://freesound.org/docs/api/overview.html#downloading-sounds).

All 30 downloaded files passed `ffprobe` inspection and a complete `ffmpeg` decode.
They total **2,693,136 bytes**, are mono at 48 kHz, and have observed overall bitrates
of roughly 154–184 kbps. Freesound describes its high-quality MP3 class as
approximately 128 kbps; these measured rates describe this specific subset.
The originals are listed as 24-bit mono WAVs at 48 kHz on the selected sound pages.
[Preview format documentation](https://freesound.org/docs/api/resources_apiv2.html#sound-instance).

The reproducible acquisition table is versioned at
`scripts/guitar-sources/quartertone.json`. It records every source filename,
sound ID, license link, verified preview URL, SHA-256, duration and cache path.
The extended inspection manifest remains in the ignored
`node_modules/.cache/guitar-sources/quartertone-sources.json`; cached previews
live beside it under `quartertone-previews/`. The full pack was not downloaded.

## Loop and audition treatment

The creator describes crossfaded loop regions at the ends of the original WAVs:
E4, B3 and G3 use frames 100,000–149,999; A2 and E2 use 200,000–249,999.
At 48 kHz these correspond to approximately 2.083–3.125 seconds and
4.167–5.208 seconds, treating the listed last frame as inclusive. **Open D3 exists
in all five layers but is omitted from the creator's loop table.** Its loop is
therefore `null` in the manifest; no replacement root is necessary.
[Creator's loop table](https://freesound.org/people/quartertone/packs/11573/).

The MP3 previews are lossy transcodes and do not retain WAV sampler-loop headers.
Original header contents and sample-exact preview loop boundaries were not
verified. For this audition, use exact-pitch one-shots with a fade before the
finite file ending and leave looping disabled. Preserve the five recorded
strengths; any equal-width velocity bands are our audition mapping because the
creator supplies layer numbers without MIDI velocity boundaries. If this library
is selected, obtain the originals through Freesound's normal download flow and
review their loop headers before preparing the production bank.
[Source recording and instructions](https://freesound.org/people/quartertone/sounds/183004/),
[Freesound preview caveat](https://freesound.org/help/faq/#i-hear-a-high-pitched-squeaking-in-the-audio-preview-what-is-that).
