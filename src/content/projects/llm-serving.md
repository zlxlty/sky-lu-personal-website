---
title: Efficient LLM serving
description: Balancing response quality, cost, and serving performance during my Cloudflare internship.
category: Engineering
context: Cloudflare
order: 2
draft: false
tags: [Model routing, Speculative decoding, Performance evaluation]
results:
  - value: <200 ms
    label: Quality-prediction inference
---

## Choosing a model

During my Cloudflare internship, I worked closely with
[Andreas Jansson](https://www.linkedin.com/in/janssonandreas/) on building and
deploying a cost-aware LLM router.
The goal was to choose a suitable model for a request while balancing expected
response quality and cost. My work included training and deploying a model to
help make that choice.

The quality predictor ran in under 200 milliseconds. This measures the
prediction step, rather than the time to generate a complete LLM response.

## Serving it efficiently

Alongside routing, I deployed and benchmarked Kimi K3 with DSpark speculative
decoding. DSpark drafts several tokens ahead, and K3 checks them together.
When enough proposals are accepted, this reduces the number of sequential
generation steps the larger model needs to take.

I evaluated how this approach affected serving performance under different
request loads, looking at the tradeoffs in throughput and latency.

## Quality, cost, and latency

Both parts of the work came back to the same question: what does it cost to
deliver a useful response? Answer quality, response time, and resource use all
matter, and the tradeoffs depend on the requests the system is handling.
