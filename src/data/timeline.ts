import type { TimelineEntry } from "@/components/blueprint/timeline-types";

/** Personal milestones, newest first. Keep dates as YYYY-MM. */
export const lifeTimeline = [
  {
    date: "2027-05",
    title: "Brown University",
    description: [
      "Expected graduation Date. Perhaps the end of my student life.",
    ],
  },
  {
    date: "2026-08",
    title: "Cloudflare",
    description: [
      "Made some impact building a better internet, and on bouldering crash pads.",
    ],
  },
  {
    date: "2026-01",
    title: "Z.ai",
    description: ["Got some free cake when the company went public."],
  },
  {
    date: "2025-08",
    title: "X Academy",
    description: [
      "Returned yet again to this sleepless place. I was just addicted to watching the sunrise.",
    ],
  },
  {
    date: "2025-03",
    title: "Carleton College",
    description: [
      "Finished undergrad. In retrospect, I actually quite liked it.",
    ],
  },
  {
    date: "2024-11",
    title: "重名島 Isle Island",
    description: [
      "First band performance at ",
      { text: "the Cave", href: "https://www.instagram.com/cc_thecave/" },
      ".",
    ],
  },
  {
    date: "2024-01",
    title: "Jazz Guitar",
    description: [
      "Started learning music theory and jazz guitar from ",
      {
        text: "Zacc",
        href: "https://open.spotify.com/artist/1e5b1Cd0y4klUqfkLsksDx",
      },
      ".",
    ],
  },
  {
    date: "2023-08",
    title: "Gap Year",
    description: ["Decided to go back to school after a year of startup life."],
  },
  {
    date: "2022-12",
    title: "Budapest AIT",
    description: ["Spent a term in Hungary for a change of pace."],
  },
  {
    date: "2021-03",
    title: "Carleton College",
    description: [
      "After a term of remote classes at 3 a.m., I finally arrived in the States.",
    ],
  },
  {
    date: "2020-05",
    title: "UWCCSC",
    description: ["Graduated from high school. Forever a UWCer."],
  },
] as const satisfies readonly TimelineEntry[];
