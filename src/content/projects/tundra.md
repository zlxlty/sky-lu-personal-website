---
title: Tundra
description: A Rust communication library that makes networking behavior explicit and composable.
category: Research
context: Brown ATLAS Group
order: 3
draft: false
tags: [Rust, Memcached, Network systems]
results:
  - value: +30%
    label: Memcached throughput
  - value: −20%
    label: Memcached latency
  - value: 5×
    label: Reduction in networking code
---

## Communication as composition

Tundra is a multithreaded communication library built from composable
message-stream transformations. It gives developers precise control over
networking guarantees while letting them optimize communication behavior.

My work with Nikos Vasilakis in Brown's ATLAS Group focused on implementing
this approach in Rust.

## The implementation

The library expresses communication as transformations of a message stream.
Those transformations form the building blocks for a networking pipeline,
keeping its behavior explicit as the pieces are composed.

The project brings together Rust, multithreaded network programming, and
distributed systems, with Memcached used for evaluation.

## Evaluation with Memcached

The Memcached evaluation increased throughput by 30%, reduced latency by 20%,
and reduced the networking codebase by a factor of five.

These results capture both performance and implementation size: the work made
the communication path faster while requiring less networking code.
