---
title: KVonset
description: A high-performance in-memory key-value store built around nonblocking Linux I/O and concurrent storage.
kind: independent
tags:
  - Rust
  - epoll
  - Lock-free concurrency
  - Systems programming
draft: false
---

KVonset explores how a small Rust server can combine explicit I/O state with
concurrent storage while keeping its latency profile predictable.

## Event-driven I/O

The server uses edge-triggered epoll, multithreaded accept, and a nonblocking I/O
state machine.

## Concurrent storage

A hot-key cache fronts a sharded concurrent hash map. The resulting system
reached 335,000 keys per second with p95 latency below 170 microseconds.
