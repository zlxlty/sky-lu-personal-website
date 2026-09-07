import manifest from "@/assets/guitar/quartertone.json";
import { createSampleBank } from "./sample-bank";

// This module is imported only on sound activation (or by the development lab).
// Its asset graph contains the chosen Yamaha, never the other audition banks.
const urls = import.meta.glob<string>("/src/assets/guitar/quartertone/*.mp3", {
  eager: true,
  query: "?url",
  import: "default",
});

export const quartertoneBank = createSampleBank(
  manifest,
  (file) => urls[`/src/assets/guitar/${file}`],
);
