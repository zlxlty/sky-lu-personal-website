---
title: Efficient LLM serving
description: A cost-aware model router and inference evaluation stack for efficient large-language-model serving.
kind: professional
affiliation: Cloudflare
tags:
  - Python
  - ModernBERT
  - SGLang
  - Mooncake
  - Kubernetes
draft: false
---

The work combines routing policy, quality prediction, and systems benchmarking
to make model serving faster and more cost-aware.

## Quality-aware routing

A ModernBERT-based quality predictor ran as a serverless GPU service with
sub-200 ms inference latency, providing a signal for cost-aware model routing.

## Systems evaluation

The evaluation covered Kimi K3, DSpark, SGLang, and Mooncake on B300 Kubernetes
clusters. Speculative decoding and prefill/decode disaggregation improved tokens
per second by 108%.
