---
title: Dynamic Pages
description: Custom page authoring and delivery, letting customers shape the presentation while Cloudflare Access manages the access flow.
category: Engineering
context: Cloudflare
order: 1
draft: false
tags: [Kubernetes, PostgreSQL, Edge KV]
results:
  - value: 3,000+
    label: Enterprise accounts enabled
  - value: <500 ms
    label: Measured propagation to edge KV
  - value: <200 ms
    label: Page-serving p95 latency
---

## Custom pages, with Access in control

Dynamic Pages lets enterprise customers create their own Access login and block
pages. Customers control the presentation, while Cloudflare Access continues to
handle authentication and enforce access policies.

During my Cloudflare internship, I worked on both the custom-page authoring
experience and the path from an authored page to delivery at the edge. The
feature enabled more than 3,000 enterprise accounts to customize their pages.

## Balancing customization and safety

The authoring experience used sandboxed templates populated with request-time
context from Access. My work involved balancing how much customers could
customize with the constraints needed to keep those templates safe.

## From authoring to the edge

Newly authored page templates become durable change records in PostgreSQL.
I designed the pipeline that publishes those changes to Cloudflare's global
edge KV, making the templates available to serve visitors around the world.
This involved coordinating delivery across six Kubernetes services.

In project measurements, updates reached edge KV within 500 milliseconds, and
page-serving p95 latency was below 200 milliseconds. These measure two separate
steps: publishing a change and serving a page to a visitor.
