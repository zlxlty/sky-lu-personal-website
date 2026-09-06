---
title: Dynamic Pages
description: A global publishing pipeline for custom Cloudflare Access login and block pages.
category: Engineering
context: Cloudflare
order: 1
draft: false
tags: [Kubernetes, PostgreSQL, Edge KV]
results:
  - value: 3,000+
    label: Enterprise accounts enabled
  - value: <500 ms
    label: Change propagation to edge KV
  - value: <200 ms
    label: Page-serving p95 latency
---

## From a change record to the edge

Dynamic Pages lets enterprise accounts customize their Access login and block
pages. The work spans two parts of the system: publishing a durable change and
serving the resulting page close to the request.

During my software engineering internship at Cloudflare, I drove delivery across
six Kubernetes services. The feature enabled more than 3,000 enterprise accounts
to use sandboxed templates with request-time context.

## The publishing pipeline

I designed a global publishing pipeline that propagates durable PostgreSQL
change records to edge KV within 500 milliseconds. This connects the stored
configuration to the edge-serving path.

The implementation brought together:

- PostgreSQL records as the durable publishing input.
- Coordination across six Kubernetes services.
- Edge KV propagation for the custom-page serving path.
- Sandboxed templates populated with request-time context.

## Delivery and latency

Custom pages were served at less than 200 milliseconds p95 latency. Propagation
time and serving latency describe different parts of the system: the first
measures how quickly an update reaches edge KV, and the second measures how
quickly a custom page is served.
