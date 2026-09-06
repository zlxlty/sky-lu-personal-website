import type { YearMonth } from "./types";

export interface Experience {
  readonly id: string;
  readonly company: string;
  readonly role: string;
  readonly location: string;
  readonly start: YearMonth;
  readonly end: YearMonth | null;
  readonly summary: string;
  readonly highlights: readonly string[];
  /** Collection IDs, not URLs or copies of project titles/results. */
  readonly projectIds: readonly string[];
}

/** Newest first. All contributions come from the approved résumé. */
export const experience: readonly Experience[] = [
  {
    id: "cloudflare",
    company: "Cloudflare",
    role: "Software Engineer Intern",
    location: "Austin, TX",
    start: "2026-05",
    end: "2026-08",
    summary:
      "Built edge publishing infrastructure and efficient LLM serving systems.",
    highlights: [
      "Drove end-to-end delivery of custom Access login and block pages across a Kubernetes service stack.",
      "Designed a global publishing pipeline from durable PostgreSQL change records to edge KV.",
      "Built a cost-aware LLM router and benchmarked speculative decoding with prefill/decode disaggregation on B300 Kubernetes clusters.",
    ],
    projectIds: ["dynamic-pages", "llm-serving"],
  },
  {
    id: "z-ai",
    company: "Z.ai",
    role: "Software Engineer Intern",
    location: "Remote",
    start: "2025-12",
    end: "2026-02",
    summary: "Automated source-backed financial research with GraphRAG.",
    highlights: [
      "Built a GLM-5-powered GraphRAG system for traceable financial reports across more than 100,000 knowledge graph entities, cutting manual research from hours to minutes.",
    ],
    projectIds: [],
  },
  {
    id: "flowith",
    company: "Flowith",
    role: "Software Engineer Intern",
    location: "San Francisco, CA",
    start: "2025-03",
    end: "2025-08",
    summary: "Moved agent workflows and RAG knowledge bases to the edge.",
    highlights: [
      "Shipped 27 endpoints in a server-to-edge migration, sustaining sub-100 ms p95 edge-processing latency and 99.95% availability.",
      "Combined Supabase plan validation, Redis request limits, and D1 model quotas to govern more than 20,000 daily requests across three subscription tiers.",
    ],
    projectIds: [],
  },
  {
    id: "quantinfinite",
    company: "QuantInfinite",
    role: "Software Engineer Intern",
    location: "Shanghai, China",
    start: "2024-06",
    end: "2024-09",
    summary: "Built a responsive cross-platform portfolio manager in Flutter.",
    highlights: [
      "Shipped a portfolio manager tracking more than 5,000 stocks, reducing view render time from 80 ms to 20 ms with async gRPC data handling, memoization, and granular Riverpod updates.",
    ],
    projectIds: [],
  },
];
