---
title: KVonset
description: An in-memory key-value store built around nonblocking I/O and concurrent storage in Rust.
category: Independent
context: Systems project
order: 4
draft: false
tags: [Rust, epoll, Lock-free concurrency]
results:
  - value: 335K
    label: Keys per second
  - value: <170 μs
    label: p95 latency
---

## The request path

I built KVonset as a high-performance, in-memory key-value store in Rust.
Its networking implementation uses edge-triggered epoll, multithreaded accept,
and a nonblocking I/O state machine.

These pieces handle connection acceptance and request I/O without relying on a
blocking operation for each step of the request path.

## Concurrent storage

I designed a hybrid lock-free storage layer that combines a hot-key cache with
a sharded concurrent hash map. The two structures support the in-memory storage
path alongside the nonblocking network implementation.

The main implementation areas were:

- Edge-triggered event notification with epoll.
- Multithreaded connection acceptance.
- Explicit state for nonblocking I/O.
- A hot-key cache and sharded concurrent hash map.

## Performance

KVonset achieved throughput of 335,000 keys per second, with p95 latency below
170 microseconds. These measurements describe the implementation's benchmark
results and provide a concrete view of its throughput and tail latency.
