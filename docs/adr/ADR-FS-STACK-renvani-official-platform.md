# ADR-FS-STACK: Renvani official platform stack (founder 2026-10-23)

**Status:** **Proposed**  
**Owner:** Tech Lead (Grace) · **PO:** Elena  
**Date:** 2026-10-23  
**Authority:** Shaun Simon (post–#93/#94 merge on `dev`)  
**Base SHA:** `5e62102b33cb6e240fd072c565f8f9391caeb012` (`dev` post-#93/#94)  
**Supersedes (partial):** [ADR-FS-93](ADR-FS-93-managed-platform-boundaries.md) — **PostgreSQL host** (Render Postgres → **Neon**) and **identity** (in-repo JWT → **Clerk**). Render compute, Vercel web, R2, and BullMQ on Render Key Value **remain** unless a future ADR changes them.  
**Companion:** [RENVANI-OFFICIAL-STACK.md](../platform/RENVANI-OFFICIAL-STACK.md) (operator quick reference)

---

## Problem

Docs and code still describe **Render Postgres**, **Railway** (legacy), and **in-house JWT** as the production path. Shaun set a single **official stack** for MVP and winter field-ready. Engineering needs one ADR, a conflict inventory, a migration plan, and assignment rows — **without** agents creating vendor accounts or live credentials.

## Decision — five layers

### 1. Infrastructure

| Component | Official provider | Notes |
| --- | --- | --- |
| Web | **Vercel** | `apps/web`; preview + production; env separation |
| API / worker / webhook | **Render** | `apps/api`, `apps/worker`, `apps/webhook` |
| PostgreSQL | **Neon** | Drizzle migrations; **dev / staging / prod** projects or branches |
| Queue store | **Render Key Value** | BullMQ; `maxmemoryPolicy: noeviction` (FS-93 runbook still applies) |
| Env separation | **Vercel + Render + Neon** | Distinct URLs and connection strings per environment; no prod secrets in preview |

### 2. Security

| Component | Official approach |
| --- | --- |
| Identity | **Clerk** (staff sign-in; replaces long-term reliance on in-repo JWT for product auth) |
| Tenant authorization | **Renvani app layer** — `companyId` from Clerk org/membership mapping; roles unchanged in domain model |
| Data isolation | **PostgreSQL** tenant predicates on every query (Neon does not replace app-layer checks) |
| Automated security tests | **CI + Sam matrix** — extend FS-92 / FS-85 patterns for Clerk sessions and Neon-backed staging |

### 3. Operations

| Component | Official provider |
| --- | --- |
| Object storage | **Cloudflare R2** |
| Error tracking | **Sentry** |
| Product analytics | **PostHog** |
| Queue monitoring | **Render metrics + structured logs** (`pino`); DLQ/replay per [MVP-PLATFORM-P0-INFRA](../planning/MVP-PLATFORM-P0-INFRA.md) |
| Internal admin | **Renvani operator surfaces** on web + API (no separate admin SKU in this ADR) |

### 4. Revenue

| Component | Official provider | Environment rule |
| --- | --- | --- |
| Payments | **Stripe Connect** | **Test mode in dev/staging**; **LIVE in production only** — Shaun owns live key activation and Connect onboarding |
| Email (transactional) | **Resend** | Replaces SendGrid as official adapter target |
| SMS | **Twilio** | **Sandbox / test** in non-prod; live send policy unchanged (queued worker, FS-13) |
| Booking + recurring service | **Renvani domain** | FS-21 / maintenance plans; Stripe for money movement only |

### 5. Intelligent execution

| Component | Official approach |
| --- | --- |
| LLM tracing | **Langfuse** |
| Agent eval | **Langfuse + repo fixtures** (`@fsm/ai`, FS-MIGRATE golden bundles, FS-72 dry-run) |
| Human approvals | **Agent control plane** (existing); no autonomous customer send in v1 |
| Audit | **`activity_events`** + import/agent batch events |
| Outcome measurement | **PostHog + Langfuse** linked to recommendation/action IDs where possible |

---

## Founder-owned accounts (Shaun creates; engineering does not)

Credentials and billing stay with **Shaun**. Engineering documents env var **names** only in `@fsm/config` / runbooks.

| # | Service | Shaun action |
| --- | --- | --- |
| 1 | **Vercel** | Team/project; Production + Preview envs; domain |
| 2 | **Render** | Workspace; web + worker + webhook services; Key Value instance |
| 3 | **Neon** | Organization; **dev**, **staging**, **prod** databases (or branches); connection strings to Render/Vercel |
| 4 | **Clerk** | Application; organizations mapped to `companyId`; dev vs prod instances |
| 5 | **Cloudflare** | R2 bucket(s) per env; API tokens scoped to bucket |
| 6 | **Sentry** | Org + projects (api, web, worker) |
| 7 | **PostHog** | Project + API key (staging vs prod) |
| 8 | **Langfuse** | Project + keys for worker/API AI paths |
| 9 | **Stripe** | Platform + Connect; **test** keys for dev; **live** keys founder-only for prod |
| 10 | **Resend** | Domain verification; API keys per env |
| 11 | **Twilio** | Account; **sandbox** for dev/staging; prod number policy with Elena |
| 12 | **OpenAI** | Org billing (existing); keys per env |

---

## Conflicts — docs and code (current `dev`)

| Area | Current state | Target | Migration track |
| --- | --- | --- | --- |
| **PostgreSQL host** | ADR-FS-93, FS-93 runbook, `docs/env/README.md` → Render Postgres | **Neon** | STACK-01: connection strings, pool limits (FS-80), staging seed |
| **Identity** | `apps/api/src/lib/tokens.ts`, JWT env in `@fsm/config`, FS-84 contract | **Clerk** | STACK-02: BFF/session bridge; phased cutover ADR addendum |
| **Email** | `SENDGRID_*`, SendGrid adapter references | **Resend** | STACK-08: adapter swap in `apps/api/src/lib/email.ts` |
| **Deploy docs** | `PRODUCTION-DEPLOYMENT.md`, Railway wording in `docs/env/README.md`, `AGENTS.md` § deployment | Vercel + Render + **Neon** | STACK-00 (this ADR) + doc sweep PR after acceptance |
| **Observability** | `pino` only in places | **Sentry + PostHog** | STACK-04 |
| **AI ops** | OpenAI usage logging partial | **Langfuse** | STACK-07 |
| **Analytics / errors in CI** | No Sentry DSN in repo | Env-only injection | Shaun accounts → Ezra runbook |

**Non-conflict (unchanged):** Fastify API shape, BullMQ queues, Drizzle schema, R2 storage adapter pattern, Stripe webhook app on Render, multi-tenant `companyId` in services.

---

## Migration plan (no big-bang)

| Phase | Scope | Owner | Gate |
| --- | --- | --- | --- |
| **M0** | Accept ADR; conflict list; assignments | Grace / Elena | This PR merged |
| **M1** | Neon **dev** `DATABASE_URL`; CI test DB unchanged or Neon branch | Iris / Ezra | Shaun provides dev connection string |
| **M2** | Neon staging + Render services wired; FS-92 staging matrix | Sofia / Ezra | Separate deploy PR |
| **M3** | Clerk **dev**; parallel read with JWT; feature flag | Noah / Sam | STACK-02 |
| **M4** | Clerk cutover staging; FS-84 contract update | Noah / Isaac | Security sign-off |
| **M5** | Resend adapter; Twilio sandbox env docs | Leo / Hana | No live SMS |
| **M6** | Sentry, PostHog, Langfuse in worker/API | Ezra / Marcus | Shaun keys |
| **M7** | Production Neon + Stripe **live** (founder) | Shaun + Grace | Explicit founder OK |

**Rule:** No production deploy or live Stripe from documentation PRs alone.

---

## Acceptance gates

| Party | Status |
| --- | --- |
| Tech Lead (Grace) | **Proposed** |
| Product Owner (Elena) | Pending |
| Architecture (Isaac) | Pending |
| QA (Lily) | Pending |
| Security (Sam) | Pending — Clerk + Neon tenant story |

---

## Consequences

- New implementation PRs **must not** assume Render Postgres or JWT as the long-term identity source.  
- `AGENTS.md` tech stack table needs a **follow-up PR** after this ADR is **Accepted** (repo law: do not silently edit locked tables in the same merge without PO ack).  
- FS-93 remains historical record; **hosting rows for DB and auth are amended by this ADR**.
