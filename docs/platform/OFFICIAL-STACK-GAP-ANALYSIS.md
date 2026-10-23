# Gap analysis — official stack vs current `dev`

**Canonical spec:** [OFFICIAL-OPERATIONAL-STACK.md](../OFFICIAL-OPERATIONAL-STACK.md) (founder-approved, verbatim)  
**Engineering ADR:** [ADR-FS-STACK](../adr/ADR-FS-STACK-renvani-official-platform.md)  
**Target date:** winter **migration-ready 2026-12-05 CT** · field-ready **2026-12-12 CT** (`MVP-SHORTEST-PATH-WINTER-2026.md`)  
**FS-MIGRATE M1:** **not blocked** — presets (#92) use existing Postgres + worker paths until Neon dev is wired.

---

## Summary matrix

| Official layer | Target | Current repo / docs | Gap severity | Ticket |
| --- | --- | --- | --- | --- |
| **Neon PostgreSQL** | Managed Neon; dev/staging/prod | Generic `DATABASE_URL`; ADR-FS-93 **Render Postgres**; `docs/env/README.md` Railway/Render DB | **High** | STACK-01 |
| **Clerk** | Staff auth, org mgmt | In-house JWT + `refresh_tokens`; `apps/api/src/plugins/authenticate.ts`; FS-84 | **High** | STACK-02, STACK-03 |
| **PostgreSQL RLS** | RLS + app `companyId` | App-layer tenant filters only; FS-93 “RLS optional”; no policies in migrations | **High** | STACK-10 |
| **Render + Vercel deploy** | Official hosts; env separation | `PRODUCTION-DEPLOYMENT.md`, FS-93 runbook; mixed Railway wording | **Med** | STACK-11, STACK-12 |
| **Render Key Value / BullMQ** | Queues on Redis-compatible store | **Implemented** — `@fsm/jobs`, workers; needs prod Key Value + monitoring | **Med** | STACK-05, Hana queue hardening |
| **Cloudflare R2** | File storage | R2 adapter in repo; buckets = founder | **Low** | STACK-06 |
| **Sentry / PostHog** | Errors + product analytics | `pino` only; no SDK wiring | **Med** | STACK-04 |
| **Langfuse** | AI traces + eval | OpenAI in `@fsm/ai`; partial token logging; no Langfuse | **Med** | STACK-07 |
| **Stripe Connect** | Merchant payouts | Connect in schema/webhooks; test-oriented | **Med** | STACK-09 (founder keys) |
| **Stripe Billing** | Platform subscriptions | FS-94 **post-MVP**; limited operator billing in code | **Med** | STACK-13 |
| **Resend** | Email | **SendGrid** adapter + `SENDGRID_*` env | **Med** | STACK-08 |
| **Twilio** | SMS sandbox until prod | Twilio adapter; sandbox not documented per env | **Low** | STACK-08 |
| **Agent control plane** | Approvals, audit | `agent_actions`, FS-72 policy PRs; aligns with stack §5 | **Low** | FS-72 / Noah runtime |
| **Staging environment** | Isolated staging stack | Partial docs (`environment-boundary-matrix`); not fully provisioned | **High** | STACK-11 |
| **Automated security tests** | CI tenant matrix | FS-92, FS-85, Sofia migrate tests — extend for Clerk/RLS | **Med** | STACK-03, STACK-10 |

---

## Code touchpoints (conflicts)

| Path | Today | Action |
| --- | --- | --- |
| `packages/config/src/env.ts` | `JWT_*`, `SENDGRID_*`, `DATABASE_URL` | Add Clerk/Resend/Langfuse/Sentry/PostHog env validation when wiring PRs land |
| `apps/api/src/lib/tokens.ts`, `plugins/authenticate.ts` | JWT verify | Clerk middleware + mapping; flag-gated (STACK-02) |
| `apps/api/src/lib/email.ts` (or equivalent) | SendGrid | Resend adapter (STACK-08) |
| `packages/db/migrations/*` | No RLS policies | ADR + migration for RLS policies (STACK-10) — **after** Neon staging |
| `docs/adr/ADR-FS-93-managed-platform-boundaries.md` | Render Postgres, JWT | **Partially superseded** by official stack + ADR-FS-STACK |
| `AGENTS.md` | Railway deploy, SendGrid, JWT auth | STACK-00 reconcile post-ADR Accept |

---

## Sequencing vs FS-MIGRATE M1

| Work | May proceed on current `DATABASE_URL` | Requires Shaun credentials |
| --- | --- | --- |
| **#92** preset catalog, worker map job | **Yes** | No |
| **#96** 0026 lineage schema | **Yes** (local/CI Postgres) | No |
| Neon cutover | No | Neon connection strings |
| Clerk dev | Parallel only | Clerk dev app |
| RLS policies | No (needs Neon staging target) | Neon staging |
| Sentry/PostHog/Langfuse | Optional in dev | API keys |

---

## Accounts Shaun must create (engineering does not)

**Infrastructure & product (layers 1–5)**

| Service | Purpose |
| --- | --- |
| Vercel | `apps/web`, previews, production |
| Render | API, worker, webhook, **Key Value** |
| Neon | PostgreSQL dev / staging / prod |
| Clerk | Auth, organizations → `companyId` |
| Cloudflare | R2 buckets per env |
| Sentry | api, web, worker projects |
| PostHog | Product analytics (also layer 8) |
| Langfuse | AI tracing and eval |
| Stripe | **Billing** (platform) + **Connect** (tenants); test vs live |
| Resend | Transactional email |
| Twilio | SMS (sandbox first) |
| OpenAI | Model API (usage monitoring per MVP policy) |

**Company & GTM (layers 7–8 — founder ops, not app deploy)**

| Service | Purpose |
| --- | --- |
| Notion | PO / planning |
| Google Workspace | Company email, support inbox |
| HubSpot CRM | Sales/marketing |
| GitHub | Repo (existing) |
| Figma | Design |
| Cursor Ultra | Engineering (existing) |

Credentials flow: Shaun → Render/Vercel secret stores only; never committed.
