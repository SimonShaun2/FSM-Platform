# ADR-FS-93: Managed platform boundaries and deployment responsibility

**Status:** **Accepted** (founder architecture decision 2026-10-22) — **PO + Security ACK pending** for FS-93 ticket completion  
**Owner:** Tech Lead  
**Date:** 2026-10-22  
**Accepted:** 2026-10-22 (Option A — Shaun Simon)  
**Base SHA:** `7f1e6328e1a5ba54c7477b0cce0496502235f1e0`  
**Evidence:** [FS-93 founder decision proposal](../decisions/FS-93-founder-decision-proposal.md) §7; [PR #59](https://github.com/SimonShaun2/Renvani/pull/59)  
**Supersedes:** None (reconciles `docs/planning/PRODUCTION-DEPLOYMENT.md` in a follow-up reviewed PR)  
**Superseded by:** None

---

## Problem

Renvani must run web, API, workers, webhooks, PostgreSQL, Redis-compatible queues, and vendor adapters with clear **tenant security**, **recovery**, and **merge authority**, without assuming Supabase/Vercel/Render capabilities that are not verified in live accounts.

## Decision

**Option A — Vercel web + Render compute/data + R2 storage + in-repo JWT** (founder-approved 2026-10-22; **Render** as compute host recorded 2026-10-22 5:12 PM CT — supersedes earlier Railway wording).

| Responsibility | Managed provider | Renvani-owned application controls |
| --- | --- | --- |
| Web (Next.js) | **Vercel** | UX, auth cookies/BFF, tenant-safe data fetching, exact-head CI |
| API (Fastify) | **Render** (web service) | JWT validation, `companyId` from membership, Zod boundaries, rate limits |
| Worker (BullMQ) | **Render** (background worker) + **Key Value** | Idempotent processors, tenant in job payload, DLQ review |
| Webhook app | **Render** (web service) | Signature verification, dedupe inbox, no inline money logic outside handlers |
| PostgreSQL | **Render Postgres** | Drizzle migrations, transaction policy (FS-80), tenant predicates |
| Queue store | **Render Key Value** (Redis-compatible) | BullMQ; **`maxmemoryPolicy: noeviction`**; queue isolation; no tenant data as sole security boundary |
| Object storage | **Cloudflare R2** | Tenant object ACLs, signed URLs, separate restore evidence |
| Identity | **In-repo JWT/session** | Staff lifecycle FS-84; future IdP only via **new ADR** |
| Secrets | Host secret stores per environment | Rotation, no secrets in previews/logs; **founder-owned accounts** |
| CI/CD | GitHub Actions (`batch-ci`) | E.. CoS merge to `dev`; founder `main` |

**Explicit non-goals:** Supabase Auth cutover in this ADR; Kubernetes; multi-region; live vendor migration without inventory; **any account/resource/credential creation or deploy** (founder-only, separate approvals).

## Alternatives considered

- **Option B** (Supabase Postgres-focused): not selected.  
- **Option C** (Vercel-maximal serverless API): rejected.

## Security impact

- FS-92 must prove anonymous and cross-tenant denial on **staging** matching Option A once provisioned.  
- Render Key Value for BullMQ must use **`noeviction`**; see [FS-93 Render runbook](../platform/FS-93-render-runbook.md).  
- RLS optional only after pool/session context proof; never replace app-layer `companyId` checks.  
- Privileged DB credentials server-only.

## Consequences

- FS-75, FS-76, FS-80, FS-84, FS-85, FS-92, FS-94, FS-88 **design** against Option A.  
- `PRODUCTION-DEPLOYMENT.md` reconciliation via separate reviewed doc PR.  
- No production deploy from this ADR alone. Staging provisioning requires **separate founder OK**.

## Acceptance record

| Party | Status | Date |
| --- | --- | --- |
| Founder (Shaun) | **ACK — Option A (architecture only); Render host 5:12 PM CT** | 2026-10-22 |
| Product Owner | **Pending** | — |
| Security | **Pending** | — |
| E.. CoS | Merge FS-93 evidence to `dev` per batch policy | — |
