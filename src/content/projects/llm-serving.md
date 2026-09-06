---
title: Efficient LLM serving
description: Cost-aware model routing and inference benchmarks across a distributed GPU serving stack.
category: Engineering
context: Cloudflare
order: 2
draft: false
tags: [ModernBERT, SGLang, Mooncake, Kubernetes]
results:
  - value: +108%
    label: Tokens per second in benchmarks
  - value: <200 ms
    label: Quality-predictor inference
---

## Routing with a quality estimate

I built and deployed a cost-aware LLM router during my Cloudflare internship.
The router used a ModernBERT-based model quality predictor, which I trained and
containerized for a serverless GPU service.

The predictor achieved inference latency below 200 milliseconds. This result
describes the quality-prediction service, rather than the time required for a
language model to generate a complete response.

## Exploring the serving stack

Alongside the router, I deployed and benchmarked Kimi K3 with DSpark speculative
decoding on B300 Kubernetes clusters. The serving configuration used SGLang and
Mooncake for prefill/decode disaggregation.

The work connected model-level decoding choices with how inference was deployed
across the GPU infrastructure.

## Benchmark result

Speculative decoding and prefill/decode disaggregation improved tokens per second
by 108% in the benchmarks. The quality predictor and serving benchmarks were
distinct parts of this work, with latency and throughput measured separately.
