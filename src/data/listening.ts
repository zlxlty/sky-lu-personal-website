import { definePlaylist } from "@/lib/record-playlist";

// Add a record here. Array order is the turntable's order; the ends wrap around.
// Optional metadata: record and videoUrl.
export const listeningTracks = definePlaylist([
  {
    id: "seaway",
    audioSrc: "https://audio.skylu.me/seaway.m4a",
    title: "海路 Seaway (Covered by me)",
    author: "Yuki Matsui",
    record: "FRIEND",
  },
  {
    id: "like-a-star",
    audioSrc: "https://audio.skylu.me/likeastar.m4a",
    title: "Like a Star (Covered by me)",
    author: "Youngso Kim",
    record: "Single",
  },
  {
    id: "starry-sky",
    audioSrc: "https://audio.skylu.me/starrysky.m4a",
    title: "繁星 Starry Sky (Covered by me)",
    author: "杨楚骁",
    record: "Single",
  },
]);
