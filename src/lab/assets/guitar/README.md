# Guitar audition assets

Development-only alternatives for `/lab/guitar`. These files are imported through
Vite from `src/lab`, and are absent from the production build. The selected Yamaha
is shared from `src/assets/guitar/`; only that library ships with the homepage.

- **Shinyguitar** by D. Smolken / Karoryfer Lecolds: microphone recordings of
  an archtop guitar, CC0 1.0. Four recorded velocity layers and the first two
  alternate takes per required source pitch. Original WAVs converted to mono
  MP3 with ffmpeg; no EQ, reverb, or per-file normalization. The release contains
  four takes per layer; this audition uses two to limit its download.
  [Original source](https://github.com/sfzinstruments/karoryfer.shinyguitar/tree/57243cca85277dbcc120ce17c6178032f93c80f3),
  [creator and demos](https://shop.karoryfer.com/pages/free-shinyguitar).
  License: `SHINYGUITAR-CC0.txt`.
- **FSS Steel String Guitar** by Gary Campion / FlameStudios, assembled for
  FreePats: GPLv3 or later with the FreePats composition exception, reproduced
  in `FSS-NOTICE.txt`, alongside the full license in `FSS-GPL.txt`.
  The selected WAV files in `fss/` are unmodified copies and
  their own preferred source format. This license applies to these sample assets.
  [Original complete source archive and mapping](https://freepats.zenvoid.org/Guitar/FSS-SteelStringGuitar/FSS-SteelStringGuitar-SFZ-20200521.tar.xz),
  [creator page](https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html).
- **Quartertone ClassicalGuitar-multisampled** (in `src/assets/guitar/`): all six open strings, four
  recorded strengths each, CC BY 4.0. Uses the public high-quality MP3 previews,
  converted to mono 44.1 kHz with a 300 ms tail fade. The strongest fifth tier is
  omitted; the remaining four span all MIDI velocities. No looping; chord
  transposition happens during playback.
  Originals require Freesound sign-in; these previews do not preserve verified
  sampler loop headers. Attribution and changes are in `QUARTERTONE-NOTICE.txt`;
  full terms are in `QUARTERTONE-CC-BY-4.0.txt`. Per-file sources, licenses, and
  input hashes are versioned in `scripts/guitar-sources/quartertone.json`.
  [Creator's pack](https://freesound.org/people/quartertone/packs/11573/).
- **University of Iowa guitar**: six open strings at pp, mf, and ff, under the
  university's usage permission. Initial notes are isolated from the mono
  chromatic scales, filtered below 30 Hz to remove subsonic rumble, faded over
  their last 150 ms, and converted to MP3. Source URLs/hashes and reviewed end
  times are retained in the generated manifest. See `IOWA-PERMISSION.txt` and
  the [source page](https://theremin.music.uiowa.edu/MISguitar.html).

`manifest.json` records original pitches, layer ranges, sample offsets, source
revision/checksum, and one gain trim per library. Relative dynamics within each
library are preserved. Level matching uses average energy of six medium notes,
not a claim that every note or gesture has identical perceived loudness.
Quartertone's four strengths and Iowa's three dynamics use equal MIDI bands
chosen for this audition; these boundaries are not supplied by their creators.
Quartertone retains its original gain calibration using the fourth recorded
layer; omitting the fifth does not boost the remaining samples.

Run `pnpm samples:prepare` with the pinned Node/pnpm runtime, `ffmpeg`, and `tar`
to reproduce this subset. Original downloads are cached under
`node_modules/.cache/guitar-sources`. This command is explicit and never runs
during installation, builds, or page visits.
