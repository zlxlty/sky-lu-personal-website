# Acoustic guitar sample sources

Researched 2026-09-06 for the homepage guitar. This is a source and implementation
assessment, not an auditory comparison. The user selected recorded samples;
the particular library remains to be chosen. The development audition now includes
all four shortlisted voices; public homepage audio is still pending selection.

## Recommended shortlist

### Shinyguitar: strongest variation and simplest asset license

Karoryfer recorded an archtop guitar through both its pickup and a microphone.
The microphone recordings are available separately, so an acoustic-only voice
is possible. The complete collection contains 846 WAV files and is a 352 MB
download. It is an archtop rather than a conventional flat-top acoustic guitar;
audition that tonal difference before choosing it.
[Creator page and demos](https://shop.karoryfer.com/pages/free-shinyguitar).

The acoustic SFZ mapping has four velocity bands and four alternate recordings
per sampled pitch. Separate mappings include muted-string, release, and
percussive recordings. The repository publishes the library under CC0 1.0.
[Acoustic mapping](https://github.com/sfzinstruments/karoryfer.shinyguitar/blob/master/Programs/acoustic_one.sfz),
[noise mapping](https://github.com/sfzinstruments/karoryfer.shinyguitar/blob/master/Programs/acoustic_noises.sfz),
[license](https://github.com/sfzinstruments/karoryfer.shinyguitar/blob/master/LICENSE).

Inspection of the acoustic mapping shows that our open E2 and A2 pitches have
matching recordings; D3, G3, B3, and E4 use neighboring samples shifted by one
semitone. This is a pitch-mapped instrument, not a complete recording matrix of
every fret on every physical string. For a browser subset, use only the required
microphone samples and preserve the original pitch and velocity metadata.
[Acoustic mapping](https://github.com/sfzinstruments/karoryfer.shinyguitar/blob/master/Programs/acoustic_one.sfz).

### FreePats FSS: conventional steel-string candidate

This library derives from FlameStudios' Seagull steel-string acoustic recordings.
The creator offers full and small SFZ/WAV versions, listed at 13 MiB and 2.7 MiB.
Its license is GPLv3 or later with the FreePats special exception. Sample
distribution still needs its license/source obligations handled; the composition
exception is not a blanket replacement for those terms.
[Creator page and downloads](https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html),
[license exception](https://freepats.zenvoid.org/licenses.html#GPL_exception).

Inspection of the linked archives found 59 sample regions in the full mapping,
with two velocity layers for some pitches but only one for others. The small
mapping has 13 regions without velocity splits. Neither mapping provides random
or sequential alternate-take selection. Prefer the full version for an audition,
and do not describe it as a uniform multilayer or round-robin library.
[Full archive inspected](https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-SFZ-20200521.tar.xz),
[small archive inspected](https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-small-SFZ-20200521.tar.xz).

### University of Iowa: recorded guitar with per-string dynamics

The guitar page documents a Raimundo 118, recorded in an anechoic chamber, with
separate string recordings at pp, mf, and ff dynamics. Mono and stereo downloads
are available. The project explicitly permits downloading and using its samples
in any projects without restrictions, and mentions application developers among
its users. Preserve the permission page alongside the asset provenance.
[Guitar recordings](https://theremin.music.uiowa.edu/MISguitar.html),
[project permission](https://theremin.music.uiowa.edu/MIS.html).

The published page establishes three dynamic levels, but not alternate takes for
each level. It identifies the guitar by model without specifying string material;
do not describe it as a steel-string library from that evidence. Original samples
would require selecting and preparing the notes for web playback.

## Other useful sources

- [Quartertone's ClassicalGuitar-multisampled](https://freesound.org/people/quartertone/packs/11573/)
  records a Yamaha Eterna classical guitar with finger-plucked notes, fret noises,
  and five velocity layers per sampled position. Filenames include fret, string,
  MIDI pitch, and strength. The inspected [sample page](https://freesound.org/people/quartertone/sounds/183083/)
  uses CC BY 4.0. Check every selected file's license, provide attribution, and
  account for the authored loop regions when preparing decay. Original downloads
  require Freesound sign-in.
- [FreePats nylon guitar](https://freepats.zenvoid.org/Guitar/acoustic-guitar.html)
  is CC0 and has a 6.9 MiB WAV archive. Its creator notes that recording conditions
  were not ideal and that noise filtering was applied; audition before adopting.
- [tonejs-instruments](https://github.com/nbrosowsky/tonejs-instruments)
  is convenient for a basic audition. Its loader is MIT, while its edited samples
  are CC BY 3.0. The acoustic pitch map uses one recording per pitch, without
  velocity-layer or alternate-take selection. Its
  [source information](https://github.com/nbrosowsky/tonejs-instruments/blob/master/sample-source-info.txt)
  identifies Iowa as the guitar source; do not assume it is steel-string merely
  from the `guitar-acoustic` directory name.

## Plucking and strumming

Proposed interaction: a click triggers a single recorded note. A drag schedules
the same notes in crossing order, preserving gesture timing, direction, and
partial strums. Strength chooses a velocity layer; alternate takes vary repeated
plucks. This keeps the audio tied to the visible strings. It does not reproduce
every physical interaction between strings and guitar body in a real strum.

Actual strummed recordings are also available. For example, spitefuloctopus's
[palm-muted D-major chord](https://freesound.org/people/spitefuloctopus/sounds/315705/)
and deadrobotmusic's [E-major strumming loop](https://freesound.org/people/deadrobotmusic/sounds/628766/)
are published as CC0. These are fixed performances: they could serve a dedicated
chord/pattern gesture, but cannot independently follow an arbitrary subset of
the six strings. They are not complete dynamic pluck-and-strum instrument banks.

## Sources to treat differently

Pianobook's standard terms allow musical uses but expressly prohibit distributing
its samples or derivatives for use in another sample playback instrument. A free
download there is not sufficient permission for this public browser instrument.
[Pianobook terms](https://www.pianobook.co.uk/terms-conditions/).

Emilyguitar is sometimes repackaged online as acoustic. Its original README says
it was recorded directly from electric pickups. Shinyguitar's microphone bank is
the relevant acoustic source in this pair.
[Emilyguitar original README](https://github.com/sfzinstruments/karoryfer.emilyguitar).

## Current audition and next step

`/lab/guitar` compares Shinyguitar, FreePats FSS, Quartertone, and Iowa with the same
plucks and strums. Each uses a six-pitch subset and one RMS-based level trim; this
does not guarantee identical perceived loudness for every note. Quartertone uses
licensed public compressed previews with faded tails; Iowa uses isolated open
notes with a 30 Hz subsonic filter. The asset README records processing and credits,
and [the Quartertone inventory](./quartertone-audition.md) verifies its selected
recordings individually. Audio loads and is cached only after sound activation.
Choose the timbre before connecting the public homepage.
