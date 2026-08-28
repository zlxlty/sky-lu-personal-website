---
title: Tundra
description: A Rust communication library composed from message-stream transformations.
kind: research
affiliation: Brown ATLAS Group
tags:
  - Rust
  - Network systems
  - Distributed systems
draft: false
---

My work with Nikos Vasilakis in Brown's ATLAS Group focused on making
communication behavior explicit, composable, and optimizable. A canonical
public project link will be added only after it is verified.

## Design

Tundra expresses communication behavior as composable message-stream
transformations. The approach gives developers explicit control over networking
guarantees while keeping the implementation in Rust.

## Evaluation

In the Memcached evaluation, Tundra increased throughput by 30%, reduced latency
by 20%, and reduced networking code by 5x.
