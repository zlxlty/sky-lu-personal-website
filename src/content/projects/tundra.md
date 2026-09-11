---
title: Tundra
description: Memcached integration, scatter/gather, and benchmarking for a composable communication framework.
category: Research
context: Brown ATLAS Group
order: 3
draft: false
tags: [Rust, C, Memcached, Network systems]
results:
  - value: +151%
    label: Throughput at a 10 ms p99 SLO
  - value: −71%
    label: Median latency
  - value: −61%
    label: Communication code
---

## Communication as composition

Tundra makes communication behavior programmable: an application can compose
operations such as sharding, request delivery, and retries instead of managing
them separately around a pool of TCP connections.

I worked closely with [Ethan Lavi](https://ethanlavi.github.io/), a PhD student
in Brown's ATLAS Group who created most of Tundra's framework.

## My part in the project

My main contribution was integrating Tundra into Memcached through a C/Rust
adapter. Much of that work was understanding Memcached's parser, connection
state, and memory lifetimes so we could reuse its command handlers safely.

I also helped develop scatter/gather for multi-key requests across shards and
built and refined the benchmark clients, including a TCP multi-get baseline.

## Evaluation with Memcached

Our benchmarks show 151% higher throughput than vanilla Memcached
under a 10 ms p99 latency limit, and 71% lower median latency at low load.
Communication code shrank by 61%, excluding the separately counted C/Rust bridge.

These are results for the combined system under the evaluated workload, rather
than gains attributable to my integration or scatter/gather alone.
