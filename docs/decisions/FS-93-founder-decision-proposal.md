# FS-93 — Founder decision proposal (managed platform boundaries)

**For:** Shaun Simon (founder approval)  
**Prepared by:** Tech Lead (agent `bc-f58c7cfc-d866-4f13-bbbb-b95c96ea1f27`)  
**Date:** 2026-10-22  
**Evidence PR:** [Renvani #59](https://github.com/SimonShaun2/Renvani/pull/59) @ `511b99f4136420e23e4df3b1e92e959fb77233ca`  
**Base:** `dev` @ `7f1e6328e1a5ba54c7477b0cce0496502235f1e0`  
**Board ticket:** FS-93 — Choose managed-platform boundaries and reconcile deployment architecture  
**Staffing (FS-91):** Pair 1 Ava+Marcus (FS-84 / #62), Pair 2 Priya+Leo (FS-80 / #63), Pair 3 Sofia+Omar (FS-92), Pair 4 Ben+Nina (FS-75 / #61), Pair 5 Diego+Hana (FS-76)

**Founder architecture decision:** **Option A approved** 2026-10-22 (see §7). **ADR-FS-93** is **Accepted** on architecture; **PO + Security ACK** still required per FS-93 acceptance criteria.

**Scope of approval — architecture only:** No agent may create or mutate provider **accounts**, **resources**, **credentials**, or **deployments**. Shaun owns all accounts/secrets. **Staging provisioning** requires a **separate explicit OK** from Shaun (not granted by §7).

---

## 1. Decision question

Where does each Renvani workload run, and what stays **Renvani-owned** vs **vendor-managed**, given the current monorepo (Next.js web, Fastify API, BullMQ workers, webhook app, PostgreSQL/Drizzle, JWT auth, Stripe/Twilio/SendGrid/R2 adapters)?

---

## 2. What we know from the repository (not from live accounts)

| Workload | Codebase evidence | Deployed state |
| --- | --- | --- |
| Web | `apps/web` (Next.js) | **Unknown** — `docs/planning/PRODUCTION-DEPLOYMENT.md` names Vercel |
| API | `apps/api` (Fastify, long-lived) | **Unknown** — FS-93 targets **Render** web service |
| Worker | `apps/worker` (BullMQ consumers) | **Unknown** — needs persistent process + Redis |
| Webhook | `apps/webhook` (Stripe/Twilio ingress) | **Unknown** |
| Database | Drizzle, `packages/db/migrations` | **Unknown** — FS-93 targets **Render Postgres** |
| Queue | Redis + BullMQ | **Unknown** |
| Auth | In-house JWT + refresh (`apps/api`) | Implemented in repo; not tied to Supabase Auth |
| Object storage | R2 adapter in API | **Unknown** account linkage |

**Account verification is a founder/operator action** (log into Vercel, Render, Stripe, etc.) and is listed as a gate below — not inferable from git alone.

---

## 3. Options

### Option A — **Documented hybrid (Render compute + Vercel web + R2)** — **Recommended**

| Layer | Placement | Notes |
| --- | --- | --- |
| Web | **Vercel** | Next.js, previews, edge TLS |
| API / worker / webhook | **Render** (web service + background worker + web service) | Matches existing Fastify + BullMQ model |
| PostgreSQL | **Render Postgres** | Single writer; pool limits enforced in app (FS-80) |
| Redis-compatible queue | **Render Key Value** | BullMQ; **`maxmemoryPolicy: noeviction`** required |
| Auth | **Renvani JWT** (current) | No identity migration in FS-93 wave |
| Files | **Cloudflare R2** | Private objects; backup/restore separate from DB |
| CI | **GitHub** + approved `batch-ci` | No change to merge authority |

**Estimated monthly cost (pilot):** ~**$40–120** (Render web + worker + webhook + Postgres + Key Value + Vercel Pro + R2/usage; reconcile `PRODUCTION-DEPLOYMENT.md` in a follow-up doc PR).  
**Engineering cost:** Low — reconcile runbooks (#59, #61, #63); no runtime rewrite.  
**Operational cost:** Medium — two vendors + R2; founder retains `main` promotion.

**Unblocks when approved:**

- **FS-75 / PR #61** — provider-neutral staging matrix and env boundaries  
- **FS-80 / PR #63** — DB ops policy, transactions, connection config (no vendor swap required)  
- **FS-84 / PR #62** — staff session contract (app-layer; no Supabase Auth dependency)  
- **FS-92** (Pair 3) — isolation proofs against chosen staging Postgres/RLS *optional* layer  
- **FS-94 / FS-88** — separate Stripe contexts with clear webhook ingress on Render webhook service  
- **BUILD_LAYERS** footings wave — staging smoke path without Kubernetes

**Risks:** Doc may not match actual accounts; must run founder account inventory (§6).

---

### Option B — **Supabase Postgres (+ optional Storage) + Vercel web + Render/Fly workers**

| Layer | Placement | Notes |
| --- | --- | --- |
| PostgreSQL | **Supabase** | Pooling, PITR marketing — verify plan limits before relying |
| Auth | **Stay JWT v1**; Supabase Auth = **separate ADR** | Do not combine with FS-93 approval |
| Storage | Supabase Storage **or** keep R2 | Two recovery surfaces if both |
| API/worker/webhook | **Not on Vercel functions** for BullMQ | Keep long-lived workers on Render/Fly |

**Estimated monthly cost (pilot):** ~**$60–150** (Supabase Pro + Vercel + Render/Fly).  
**Engineering cost:** **Medium–high** — connection strings, migration runner, backup drills, possible network rules.  
**Operational cost:** Medium — strong DB UX; more policy surface (RLS, service role keys).

**Unblocks:** FS-92 RLS experiments; managed backup narrative.  
**Risks:** Service-role key handling; worker connection budget; **scope creep** into Auth migration.

---

### Option C — **Maximize Vercel (serverless API)** — **Not recommended**

Port Fastify API and BullMQ to Vercel functions/queues.

**Engineering cost:** **Very high** — conflicts with current architecture; duplicate idempotency story.  
**Unblocks:** Little that Option A does not, faster.  
**Recommendation:** Reject unless measured proof that Render (or equivalent long-lived PaaS) cannot host API at pilot scale.

---

## 4. Recommendation (Tech Lead)

**Approve Option A as the baseline platform decision**, with these **explicit guardrails**:

1. **No Supabase Auth** or wholesale DB vendor migration in the same release as FS-93.  
2. **Supabase** may be revisited only after **FS-92** staging evidence and a **separate ADR** (founder + Security).  
3. **Two payment contexts** remain isolated: **FS-94** (Renvani → operator subscription) vs **FS-88** (operator → end customer).  
4. **Pricing invariant:** Flex/Flat full product, unlimited users — no seat metering tied to host choice.  
5. Reconcile `PRODUCTION-DEPLOYMENT.md` with the responsibility matrix in [BUILD_LAYERS.md](../architecture/BUILD_LAYERS.md) via reviewed doc PR after your approval (not silent edit).

---

## 5. What your approval unlocks (next 2 waves)

| After approval | Work | Owner |
| --- | --- | --- |
| Staging footprint | FS-75 / #61 env matrix + smoke template | Pair 4 (Ben+Nina) |
| DB discipline | FS-80 / #63 policies + connection helpers | Pair 2 (Priya+Leo) |
| Session contract | FS-84 / #62 | Pair 1 (Ava+Marcus) |
| Isolation proof | FS-92 (new PR) | Pair 3 (Sofia+Omar) |
| Migration order | [MIGRATION_NUMBERING_REGISTRY.md](../platform/MIGRATION_NUMBERING_REGISTRY.md) | Tech Lead |

**Still blocked without you:** production deploy, live Stripe/Twilio, credential rotation, `main` promotion.

---

## 6. Gates only you (or delegated operator) can clear

1. **Account inventory** — List real projects: Vercel team, Render workspace/service(s), Stripe accounts (platform vs Connect), R2 bucket, SendGrid/Twilio — mark **unknown** where missing.  
2. **Pick Option A, B, or C** (or A + “evaluate Supabase in Q2” note).  
3. **Authorize staging spend** for FS-75 (isolated DB/Redis, test keys only).  
4. **SLO/RPO/RTO targets** for pilot (can be “best effort until FS-83 / #64 drill”).

---

## 7. Founder sign-off (recorded)

```text
FS-93 decision: Option A
Approved by: Shaun Simon (founder)
Timestamp: 2026-10-22 ~4:56 PM CT (2026-10-22T21:56:00Z approximate)
Architecture: Vercel (web) + Railway (API, worker, webhook, PostgreSQL, Redis) + Cloudflare R2; in-repo JWT (no Supabase Auth in this decision)
Scope: Architecture and responsibility matrix only — NOT account creation, resource provisioning, credentials, deploy, or live money
Account inventory completed: not required for this sign-off (Shaun-owned; update separately)
Staging spend authorized: no — separate explicit founder OK required before FS-75 provisioning
Recorded by: Tech Lead on PR #59 (E.. CoS / board traceability)
Notes: PO + Security ACK still required before FS-93 ticket Done. Platform tickets FS-75, FS-76, FS-80, FS-84, FS-85, FS-92 may target Option A for design/docs only until staging OK.
```

### Amendment — compute host Render (supersedes Railway in sign-off above)

```text
FS-93 amendment: Option A compute/data on Render (hosting vendor change only)
Approved by: Shaun Simon (founder)
Timestamp: 2026-10-22 5:12 PM CT
Architecture: Vercel (web) + Render (API web service, background worker, webhook web service, Render Postgres, Render Key Value for BullMQ) + Cloudflare R2; in-repo JWT (no Supabase Auth in this decision)
Render-specific: BullMQ requires Render Key Value maxmemoryPolicy noeviction; see docs/platform/FS-93-render-runbook.md and docs/infrastructure/render-blueprint.render.yaml (blueprint draft, NOT APPLIED)
Scope: Architecture and runbook only — NOT accounts, credentials, resources, deploy, or live money
Staging spend authorized: unchanged — no (separate explicit founder OK)
Recorded by: Tech Lead on PR #59
```

---

## 8. Dev team notice (Option A — design target)

Pairs may align **provider-specific design** (env matrices, runbooks, connection assumptions, negative-test plans) to **Option A** for:

| Ticket | PR / status | Pair |
| --- | --- | --- |
| FS-75 | #61 | Ben + Nina |
| FS-76 | new | Diego + Hana |
| FS-80 | #63 | Priya + Leo |
| FS-84 | #62 | Ava + Marcus |
| FS-85 | board | Platform |
| FS-92 | new | Sofia + Omar |

**Still forbidden without founder OK:** creating Vercel/Render/R2 projects, setting secrets in hosts, deploy hooks, Blueprint apply, or pointing staging at live payment/SMS providers.

---

## 9. Related artifacts

- [BUILD_LAYERS.md](../architecture/BUILD_LAYERS.md) — construction sequence and responsibility table  
- [ADR-FS-93](../adr/ADR-FS-93-managed-platform-boundaries.md) — **Accepted** (founder); PO + Security ACK pending  
- [FS-93 Render runbook](../platform/FS-93-render-runbook.md) — Key Value `noeviction`, service layout, env inventory  
- [Render blueprint draft](../infrastructure/render-blueprint.render.yaml) — reference only, not applied  
- [MIGRATION_NUMBERING_REGISTRY.md](../platform/MIGRATION_NUMBERING_REGISTRY.md) — SQL migration sequence across open PRs  
- [FS-4 TrayLoop reuse inventory](../inventory/FS-4-trayloop-reuse-inventory.md) — cross-repo patterns (inform only)  
- [FS-93 Option A dev notice](../platform/FS-93-option-a-dev-notice.md) — short broadcast for FS-75/76/80/84/85/92
