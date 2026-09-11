import { definePlaylist } from "@/lib/record-playlist";
import recordings from "./recordings.json";

// Add a record here. Array order is the turntable's order; the ends wrap around.
// Optional metadata: record and videoUrl.
export const listeningTracks = definePlaylist([
  {
    id: "seaway",
    audioSrc: `${recordings.origin}/${recordings.files.seaway}`,
    title: "海路 Seaway (Covered by me)",
    author: "Yuki Matsui",
    record: "FRIEND",
  },
  {
    id: "like-a-star",
    audioSrc: `${recordings.origin}/${recordings.files["like-a-star"]}`,
    title: "Like a Star (Covered by me)",
    author: "Youngso Kim",
    record: "Single",
  },
  {
    id: "starry-sky",
    audioSrc: `${recordings.origin}/${recordings.files["starry-sky"]}`,
    title: "繁星 Starry Sky (Covered by me)",
    author: "杨楚骁",
    record: "Single",
  },
]);
