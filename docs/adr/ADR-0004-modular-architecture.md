# ADR-0004: Modular Architecture Over Microservices

**Status:** Accepted
**Owner:** TL-01
**Date:** 2026-08-21
**Supersedes:** None
**Superseded by:** None

---

## Problem

FSM Platform V2 needs enough depth to support many domains, but premature service decomposition would slow development and create distributed-system overhead before the domain boundaries are proven.

## Current Approach

The repository is a TypeScript monorepo with separate applications for web, API, worker, and webhook processes, plus shared packages for database, types, AI, jobs, and config.

## Proposed Approach

Keep a modular monorepo architecture. Enforce domain boundaries through service modules, shared typed contracts, workers, queues, and adapters. Do not split into microservices until clear operational criteria justify it.

## Benefit

This keeps development fast, preserves type safety, reduces deployment complexity, and still supports clean domain ownership.

## Migration Cost

Low for Sprint 0 because this formalizes the current broad shape. Future extraction is possible if module boundaries remain clean.

## Operational Impact

Deployable processes remain `apps/web`, `apps/api`, `apps/worker`, and `apps/webhook`. Observability and CI should understand those process boundaries.

## Security Impact

Tenant isolation and auth checks stay centralized in the API/service layers instead of being spread across network services. Worker jobs still require explicit tenant-scoped payloads and idempotency.

## Alternatives Considered

- Microservices by domain: rejected as premature and operationally expensive.
- Single monolithic app process: rejected because workers and webhooks need separate runtime behavior and scaling.
- Serverless-only architecture: rejected because long-running workers and queue processing are core requirements.

## Decision

FSM Platform V2 will use modular architecture in the existing monorepo. Microservices are deferred until an explicit ADR proves that scale, team ownership, compliance, reliability, or deployment independence justifies the split.

## Consequences

Teams must maintain clean service boundaries inside the monorepo. Shared contracts belong in packages, not implicit database row shapes. Future extraction remains possible only if modules avoid hidden coupling.
