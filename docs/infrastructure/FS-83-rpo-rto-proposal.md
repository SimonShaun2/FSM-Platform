# FS-83 — RPO / RTO proposal (business review)

**Status:** `PROPOSED — NOT APPROVED`  
**Audience:** Product Owner / founder (business owner)  
**Author:** Infrastructure Dev 3 (Platform)  
**Date:** 2026-10-22

No numeric targets in this document are approved. FS-83 acceptance criterion #1 requires business-owner review and **recorded** objectives. Until then, engineering must not cite an SLA, contractual RPO/RTO, or “we can recover in X hours” in customer-facing or compliance materials.

---

## 1. Definitions (for alignment)

| Term | Meaning for Renvani |
|---|---|
| **RPO (Recovery Point Objective)** | Maximum acceptable **data loss window** — how far back in time restored data may be (DB, object files, and optionally queue work). |
| **RTO (Recovery Time Objective)** | Maximum acceptable **service interruption** — time from disaster declaration until critical workflows pass smoke tests in the recovery environment. |
| **RLO (Recovery Level Objective)** | Which workflows must work in the first wave vs later (optional but recommended). |

**Recovery surfaces (FS-93 / FS-83):**

1. **Relational (PostgreSQL)** — tenant data, money records, activity stream metadata.
2. **Object (R2 or successor)** — photos, documents, CSV import sources.
3. **Redis / queues** — async work in flight (usually **not** restored to exact pre-failure state).
4. **External provider state** — Stripe subscriptions, message delivery logs at Twilio/SendGrid (reconcile, not always restorable).

---

## 2. Workflow tiers (proposed RLO)

Use these tiers when the business owner selects RTO/RPO — each tier can have different objectives.

| Tier | Workflows | Why it matters |
|---|---|---|
| **T0 — Safety & tenancy** | Auth, tenant isolation, no cross-company data exposure | Legal / trust; blocks all other work |
| **T1 — Revenue continuity** | View customers/jobs, operator login, inquiry intake (read/write), estimates in flight | Direct revenue loop |
| **T2 — Money integrity** | Invoices, payments ledger, Stripe webhook reconciliation (test mode in drill) | FS-80 risk class |
| **T3 — Field execution** | Dispatch board, job status, attachments/photos | Operations |
| **T4 — Automation** | Workers, AI recommendations, campaigns, retention gates | Can lag if queues rebuilt with idempotent replay |

---

## 3. Candidate objective bands (choose one per surface)

Engineering recommends the business owner pick **one band per row** and record the decision on the FS-83 board. Bands are illustrative — adjust with pilot operator input.

### 3.1 PostgreSQL (authoritative SoR)

| Band | RPO (data loss) | RTO (T0–T2) | Notes |
|---|---|---|---|
| A — Pilot / early operator | ≤ 24 h | ≤ 24 h | Daily backups only; acceptable for pre-revenue pilot with explicit operator communication |
| B — Growth | ≤ 4 h | ≤ 8 h | Requires PITR or ≥4h backup cadence + tested restore |
| C — Money-active | ≤ 15 min | ≤ 4 h | Requires PITR + runbook staffing + FS-80 evidence |

### 3.2 Object storage (files)

| Band | RPO | RTO | Notes |
|---|---|---|---|
| A | ≤ 24 h | ≤ 48 h | Versioning/lifecycle per FS-93; DB may reference missing files until restored |
| B | ≤ 4 h | ≤ 24 h | Replication or versioning with restore drill on sample objects |
| C | ≤ 1 h | ≤ 8 h | Strong versioning + monitoring; FS-85 signed URL tests |

### 3.3 Redis / async queues

| Band | RPO | RTO | Notes |
|---|---|---|---|
| A | **Accept job loss** | ≤ 8 h after DB | Re-enqueue from DB/outbox where possible; document lost notifications |
| B | ≤ 1 h (if persistence enabled) | ≤ 4 h | FS-93 must document Redis AOF/RDB strategy |

### 3.4 External providers (Stripe, messaging)

| Band | RPO | RTO | Notes |
|---|---|---|---|
| A | Provider ledger is SoR for money movement | Reconcile within 24 h | Replay webhooks from Stripe dashboard where supported; never double-apply payments |
| B | Same | ≤ 8 h | Requires webhook idempotency checks (`apps/webhook` stripe idempotency) in drill |

---

## 4. Decision worksheet (for business owner)

Copy to FS-83 Notion evidence when complete.

| Surface | Selected band (A/B/C) | Approved RPO | Approved RTO | Approved by | Date |
|---|---|---|---|---|---|
| PostgreSQL | _pending_ | _pending_ | _pending_ | | |
| Object storage | _pending_ | _pending_ | _pending_ | | |
| Redis / queues | _pending_ | _pending_ | _pending_ | | |
| Stripe / payments | _pending_ | _pending_ | _pending_ | | |
| Operator comms (SMS/email) | _pending_ | _pending_ | _pending_ | | |

**First-wave workflows (RLO):** _pending_ (e.g. T0–T2 only for pilot)

**Customer communication policy during incident:** _pending_

**Escalation / incident commander:** _pending_

---

## 5. Dependencies before targets become operational

Approved numbers are **not implementable** until:

1. FS-93 assigns backup/restore responsibility per provider.
2. FS-80 proves at least one restore into an isolated environment.
3. FS-75 provides the isolated drill environment.
4. FS-76 defines secret rehydration for drill and production.
5. A measured drill (FS-83 phase 2) records **actual** restore duration vs proposed RTO.

---

## 6. Engineering recommendation (non-binding)

For the **first residential-cleaning pilot** with **limited live money**, band **A** on PostgreSQL and object storage with explicit operator communication is often sufficient **if** the founder accepts the data-loss window. Move to band **B/C** before scaling money-active operators or marketing SLAs.

This recommendation is input for discussion only — **not** an approved objective.
