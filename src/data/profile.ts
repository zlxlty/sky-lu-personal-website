export const profile = {
  name: "Sky Lu",
  identityLabels: [
    "Brown M.S. CS '27",
    "Software Engineer",
    "Network Systems Researcher",
    "Jazz Guitarist",
  ],
  socialLinks: [
    {
      label: "GitHub",
      href: "https://github.com/zlxlty",
    },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/tianyi-lu-sky",
    },
  ],
} as const;

export const education = [
  {
    id: "brown-ms-cs",
    institution: "Brown University",
    location: "Providence, RI",
    degree: "M.S.",
    fields: ["Computer Science"],
    completion: {
      status: "expected",
      month: "2027-05",
    },
  },
  {
    id: "carleton-ba-cs-math",
    institution: "Carleton College",
    location: "Northfield, MN",
    degree: "B.A.",
    fields: ["Computer Science", "Mathematics"],
    completion: {
      status: "completed",
      month: "2025-03",
    },
  },
] as const;

export const skills = {
  languages: ["TypeScript", "Python", "Rust", "Go", "C", "Dart", "SQL", "Bash"],
  frameworks: [
    "React",
    "FastAPI",
    "Hono",
    "Flutter",
    "Riverpod",
    "Tokio",
    "PyTorch",
    "Pandas",
  ],
  infrastructure: [
    "SGLang",
    "PostgreSQL",
    "SQLite",
    "Supabase",
    "Neo4j",
    "Redis",
    "Memcached",
    "gRPC",
    "Docker",
    "Kubernetes",
  ],
} as const;
