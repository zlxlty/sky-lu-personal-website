export const experience = [
  {
    id: "cloudflare-2026",
    organization: "Cloudflare",
    role: "Software Engineer Intern",
    location: "Austin, TX",
    period: { start: "2026-05", end: "2026-08" },
    highlights: [
      "Built and deployed a cost-aware LLM router with a ModernBERT-based quality predictor and sub-200 ms serverless GPU inference latency.",
      "Benchmarked Kimi K3 with DSpark, SGLang, and Mooncake on B300 Kubernetes clusters, improving tokens per second by 108%.",
      "Drove Dynamic Pages delivery across six Kubernetes services for more than 3,000 enterprise accounts.",
      "Propagated durable PostgreSQL change records to edge KV within 500 ms while serving custom pages at sub-200 ms p95 latency.",
    ],
  },
  {
    id: "zai-2025",
    organization: "Z.ai",
    role: "Software Engineer Intern",
    location: "Remote",
    period: { start: "2025-12", end: "2026-02" },
    highlights: [
      "Built a GLM-5-powered GraphRAG system that synthesized source-backed financial analysis across more than 100,000 knowledge-graph entities.",
    ],
  },
  {
    id: "flowith-2025",
    organization: "Flowith",
    role: "Software Engineer Intern",
    location: "San Francisco, CA",
    period: { start: "2025-03", end: "2025-08" },
    highlights: [
      "Shipped 27 edge endpoints for agent workflows and RAG knowledge bases with sub-100 ms p95 edge-processing latency and 99.95% availability.",
      "Built entitlement and rate-limiting controls governing more than 20,000 daily requests across three subscription tiers.",
    ],
  },
  {
    id: "quantinfinite-2024",
    organization: "QuantInfinite",
    role: "Software Engineer Intern",
    location: "Shanghai, China",
    period: { start: "2024-06", end: "2024-09" },
    highlights: [
      "Shipped a Flutter portfolio manager tracking more than 5,000 stocks and reduced view-render time from 80 ms to 20 ms.",
    ],
  },
] as const;
