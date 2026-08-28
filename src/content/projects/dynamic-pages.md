---
title: Dynamic Pages at Cloudflare
description: A global publishing pipeline for customizable Access login and block pages.
kind: professional
affiliation: Cloudflare
tags:
  - TypeScript
  - Kubernetes
  - PostgreSQL
  - Cloudflare KV
draft: false
---

Dynamic Pages lets Cloudflare Access customers publish customized login and
block experiences through a globally distributed path.

## Delivery boundary

The delivery path crossed six Kubernetes services and supported more than 3,000
enterprise accounts.

## State propagation

Durable PostgreSQL change records propagated to edge KV within 500 ms. The edge
serving path returned customized pages at sub-200 ms p95 latency.
