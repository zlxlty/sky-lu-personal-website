interface Person {
  name: string;
  href: string;
  note: readonly (string | { label: string; href: string })[];
}

/** Personal notes; source order is the no-JavaScript fallback. Add friends here. */
export const friends: readonly Person[] = [
  {
    name: "Beiming Zhang",
    href: "https://www.beimingz.com/",
    note: [
      "A friend from Cloudflare who went from zero to hero at bouldering in a few weeks. Also a great kayaking companion.",
    ],
  },
  {
    name: "Amitav Nott",
    href: "https://amitav.dev/",
    note: [
      "Probably knows Cloudflare’s products better than any of our fellow interns. They’ve designed and built all kinds of useful tools for our friend group.",
    ],
  },
  {
    name: "Yufeng Wu",
    href: "https://yufeng-wu.github.io/",
    note: [
      "A friend from high school. We’ve faced plenty of uncertainty together. He’s always met it with ingenuity, care, and a Beijing sense of humor.",
    ],
  },
  {
    name: "Multy Xu",
    href: "https://www.multyxu.com/",
    note: [
      "A great friend, guitarist, bandleader, and roboticist I’ve known since high school. We should definitely jam more often.",
    ],
  },
  {
    name: "Dian Gao",
    href: "https://www.diangao.space/",
    note: [
      "A fellow XAer deep in the startup world, with great ideas and the follow-through to bring them to life. She also writes beautiful poetry.",
    ],
  },
  {
    name: "Chloe Qiao",
    href: "https://www.qiaochloe.com/",
    note: [
      "A friend from Brown and Cloudflare who nudged me into bouldering, building this website, and having hotter takes.",
    ],
  },
  {
    name: "Barry Shawn",
    href: "https://barryshawn.com/en-us/",
    note: [
      "A designer and photographer whose work impresses me in every medium, and a friend I’ve watched the sunrise with at XA.",
    ],
  },
  {
    name: "Hanji Xu",
    href: "https://design.hanjixu.com/",
    note: [
      "Known since middle school, and still finding new ways to make me see things differently. Now my very organized roommate in Providence.",
    ],
  },
  {
    name: "Jasmine Yu",
    href: "https://www.linkedin.com/in/jasmine-tf-yu/",
    note: [
      "A close friend since middle school, and someone I’ve shared many deep thoughts with. Works incredibly hard and still embraces life to the fullest.",
    ],
  },
  {
    name: "Joy Fu",
    href: "https://www.linkedin.com/in/joy-fu-2798681b4/",
    note: [
      "A high school friend who went through the painful college application journey with me. A music producer on the way to becoming a lawyer.",
    ],
  },
  {
    name: "Alex Sheng",
    href: "https://alexyhsheng.github.io/",
    note: [
      "Perhaps the most knowledgeable person I know. He becomes an expert in whatever he puts his heart into. I still owe him his calculus book from high school, lol.",
    ],
  },
  {
    name: "Suyang Li",
    href: "https://mp.weixin.qq.com/s/pzsjpZzB8Bdn2mfolOOHGA",
    note: [
      "My homie from ",
      { label: "Bari", href: "https://www.instagram.com/uwccsc_bari/" },
      ". His lyrical, thought-provoking writing always resonates with me.",
    ],
  },
  {
    name: "Koho Zheng",
    href: "https://www.linkedin.com/in/koho-zheng-8b30431b3/",
    note: [
      "A great mentor and coworker from my startup days, and a truly seasoned full-stack developer.",
    ],
  },
  {
    name: "Chunyi Ou",
    href: "https://www.chunyiou.design/",
    note: [
      "My bro since kindergarten. Almost twenty years of friendship, wherever we are in the world. He’s mastered the art of product design and is THE person to talk to about soccer and history.",
    ],
  },
];
