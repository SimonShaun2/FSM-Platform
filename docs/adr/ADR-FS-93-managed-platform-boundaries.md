# ADR-FS-93: Managed platform boundaries and deployment responsibility

**Status:** Proposed — **awaiting founder option selection** (see [FS-93 founder decision proposal](../decisions/FS-93-founder-decision-proposal.md))  
**Owner:** Tech Lead  
**Date:** 2026-10-22  
**Base SHA:** `7f1e6328e1a5ba54c7477b0cce0496502235f1e0`  
**Supersedes:** None (reconciles `docs/planning/PRODUCTION-DEPLOYMENT.md` when Accepted)  
**Superseded by:** None

---

## Problem

Renvani must run web, API, workers, webhooks, PostgreSQL, Redis, and vendor adapters with clear **tenant security**, **recovery**, and **merge authority**, without assuming Supabase/Vercel/Railway capabilities that are not verified in live accounts.

## Decision (pending founder)

**Recommended baseline (Option A):**

| Responsibility | Managed provider (candidate) | Renvani-owned application controls |
| --- | --- | --- |
| Web (Next.js) | Vercel | UX, auth cookies/BFF, tenant-safe data fetching, exact-head CI |
| API (Fastify) | Railway (or equivalent long-lived PaaS) | JWT validation, `companyId` from membership, Zod boundaries, rate limits |
| Worker (BullMQ) | Railway + Redis | Idempotent processors, tenant in job payload, DLQ review |
| Webhook app | Railway | Signature verification, dedupe inbox, no inline money logic outside handlers |
| PostgreSQL | Railway Postgres (or dedicated managed Postgres) | Drizzle migrations, transaction policy (FS-80), tenant predicates |
| Redis | Managed Redis | Queue isolation; no tenant data as sole security boundary |
| Object storage | Cloudflare R2 | Tenant object ACLs, signed URLs, separate restore evidence |
| Identity | In-repo JWT/session | Staff lifecycle FS-84; optional future IdP via **new ADR** |
| Secrets | Host secret stores per environment | Rotation, no secrets in previews/logs |
| CI/CD | GitHub Actions (`batch-ci`) | E.. CoS merge to `dev`; founder `main` |

**Explicit non-goals in FS-93 wave:** Supabase Auth cutover; Kubernetes; multi-region; live vendor migration without inventory.

## Alternatives

See founder proposal Options B (Supabase Postgres-focused) and C (Vercel-maximal) — **C rejected** by Tech Lead.

## Security impact

- FS-92 must prove anonymous and cross-tenant denial on **staging** matching selected architecture.  
- RLS optional only after pool/session context proof; never replace app-layer `companyId` checks.  
- Privileged DB credentials server-only.

## Consequences

- FS-75, FS-80, FS-84, FS-92, FS-94, FS-88 proceed against **Option A** unless founder selects B.  
- `PRODUCTION-DEPLOYMENT.md` updated in a follow-up reviewed PR after Acceptance.  
- No production deploy from this ADR alone.

## Acceptance

| Party | Status |
| --- | --- |
| Founder (Shaun) | **Pending** — option + account inventory |
| Product Owner | Pending — pricing invariant |
| Security | Pending — FS-92 plan alignment |
| E.. CoS | Records Accepted when merging FS-93 evidence to `dev` |
