import manifest from "./assets/guitar/manifest.json";
import {
  createSampleBank,
  type GuitarSampleBank,
} from "@/components/guitar/audio/sample-bank";
import { quartertoneBank } from "@/components/guitar/audio/quartertone-bank";

const urls = import.meta.glob<string>("./assets/guitar/**/*.{mp3,wav}", {
  eager: true,
  query: "?url",
  import: "default",
});

export const guitarBanks: readonly GuitarSampleBank[] = [
  ...manifest.banks.map((bank) =>
    createSampleBank(bank, (file) => urls[`./assets/guitar/${file}`]),
  ),
  quartertoneBank,
];

interface GuitarBankDescription {
  id: string;
  label: string;
  name: string;
  detail: string;
  source: string;
  license: string;
  licenseUrl?: string;
  preparation?: string;
}

export const guitarBankDescriptions: readonly GuitarBankDescription[] = [
  {
    id: "shiny",
    label: "A · Acoustic archtop",
    name: "Shinyguitar",
    detail: "Microphone recording · four strengths · two alternate takes",
    source: "https://shop.karoryfer.com/pages/free-shinyguitar",
    license: "CC0",
  },
  {
    id: "fss",
    label: "B · Steel-string acoustic",
    name: "FreePats FSS",
    detail: "Seagull acoustic · one or two strengths, depending on the note",
    source: "https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html",
    license: "GPLv3+ with exception",
  },
  {
    id: "quartertone",
    label: "C · Quartertone classical",
    name: "Quartertone · ClassicalGuitar-multisampled",
    detail: "Yamaha Eterna · four strengths · finger-plucked",
    source: "https://freesound.org/people/quartertone/packs/11573/",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    preparation:
      "Compressed previews with faded endings; strongest tier omitted; no sustain loops.",
  },
  {
    id: "iowa",
    label: "D · University of Iowa",
    name: "University of Iowa · Raimundo 118",
    detail: "Raimundo 118 · three strengths · anechoic recording",
    source: "https://theremin.music.uiowa.edu/MISguitar.html",
    license: "University of Iowa usage permission",
    licenseUrl: "https://theremin.music.uiowa.edu/MIS.html",
    preparation:
      "Open notes isolated from scales; subsonic rumble filtered below 30 Hz.",
  },
];
