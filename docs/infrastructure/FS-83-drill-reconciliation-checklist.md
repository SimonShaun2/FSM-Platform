# FS-83 — Isolated drill reconciliation checklist

Execute **after** PostgreSQL restore and **before** enabling workers and production webhooks. All checks assume a **read-only** or reporting role unless noted.

SQL helpers: [`scripts/recovery/drill-reconciliation.sql`](../../scripts/recovery/drill-reconciliation.sql)

---

## 1. Schema and migration consistency

| ID | Check | Method | Pass criteria |
|---|---|---|---|
| S1 | Migration head matches app SHA | Compare `drizzle` migration journal vs `packages/db` at deploy tag | No pending migrations required for read paths |
| S2 | Core tables present | `\dt` or information_schema | Expected tables from `packages/db/src/schema.ts` exist |
| S3 | Enum types intact | Sample `SELECT` on enum columns | No cast errors on `activity_events`, `payments`, `jobs` |
| S4 | Soft-delete columns | Spot-check `deleted_at` nullable | Consistent with Drizzle schema |

**Fail action:** Stop drill; Pair 2 investigates backup age or wrong database.

---

## 2. Tenant separation

Application layer must enforce `companyId`; these DB checks detect **data corruption** or restore mix-ups.

| ID | Check | SQL / test | Pass criteria |
|---|---|---|---|
| T1 | No orphan tenant FKs | Q-tenant-orphans in SQL file | Zero rows |
| T2 | `companyId` not null on SoR tables | Q-tenant-null-company | Zero rows on customers, jobs, invoices, payments, activity_events |
| T3 | Cross-tenant job/customer mismatch | Q-tenant-job-customer | Zero rows |
| T4 | Cross-tenant invoice/customer mismatch | Q-tenant-invoice-customer | Zero rows |
| T5 | File metadata tenant consistency | Q-tenant-file-entity | Zero rows |
| T6 | API negative (required) | QA 2: authenticated user A cannot read company B resource by ID | HTTP 403/404 per FS-8 matrix |

**Fail action:** Security incident; do not enable ingress.

---

## 3. Referential integrity (sample)

| ID | Check | Pass criteria |
|---|---|---|
| R1 | Payments → invoices | All `payments.invoice_id` resolve to same `company_id` |
| R2 | Invoice items → invoices | No cross-company joins |
| R3 | Activity events entity refs | `company_id` matches linked customer/job when IDs set |
| R4 | Import session tagging | Rows with `import_session_id` share one `company_id` per session |

Use Q-ref-* queries in SQL file.

---

## 4. Queue and async reconciliation

Redis is often empty after restore; focus on **DB-visible** async state and idempotency.

| ID | Check | Method | Pass criteria |
|---|---|---|---|
| Q1 | BullMQ prefix isolated | `KEYS` or `SCAN` for `fsm:*` only on drill Redis | No production URL in connection string |
| Q2 | Stuck import sessions | `SELECT` import_sessions status distribution | Document `importing` / `failed` counts; no auto-resume without ops approval |
| Q3 | Agent actions in-flight | `agent_actions` status counts | No unexpected `executing` without worker |
| Q4 | Message logs vs queue | Compare recent `message_logs` pending vs notifications queue | Document gap; manual reconcile plan |
| Q5 | Cron jobs | Worker repeat jobs (`dormant-customer-scan`, `compute-revenue-summary-batch`) | Document re-registration after empty Redis |

**Fail action:** Keep workers off; Platform clears or requeues per FS-77 when defined.

---

## 5. Payment and Stripe reconciliation

Money checks are **read-only** in drill; use Stripe **test** dashboard or API read with drill keys.

| ID | Check | Method | Pass criteria |
|---|---|---|---|
| M1 | Duplicate Stripe intent IDs | Q-payment-duplicate-stripe-intent | Zero duplicate non-null `stripe_payment_intent_id` per company |
| M2 | Payment amount sanity | Q-payment-negative-amount | Zero rows |
| M3 | Invoice paid vs payments sum | Q-invoice-payment-balance sample | Document tolerance; flag > $0.01 drift for review |
| M4 | Maintenance plan Stripe IDs | Plans with `stripe_subscription_id` unique per company | No duplicates |
| M5 | Webhook idempotency table | If present in schema, no duplicate processed event IDs | Per `apps/webhook` idempotency store at drill head |
| M6 | Stripe dashboard spot check | 3 random `payments` rows | Status matches Stripe test object |

**Fail action:** Stop money-adjacent workers; Pair 2 + founder before replaying webhooks.

---

## 6. Object storage reconciliation

| ID | Check | Method | Pass criteria |
|---|---|---|---|
| O1 | Metadata without blob | Sample `file_attachments` / `job_photos` URLs | Missing object rate documented; under approved RPO band |
| O2 | Tenant path prefix | Key naming convention from storage adapter | No cross-tenant key prefix collision |
| O3 | Signed access | API authorized download for one file per test company | 200 + correct content-type |

Depends on FS-85; skip with documented waiver if object restore not in scope for drill wave 1.

---

## 7. Activity / audit stream

| ID | Check | Pass criteria |
|---|---|---|
| A1 | Recent events monotonic | `max(occurred_at)` reasonable for backup timestamp |
| A2 | No blank `summary` | Zero null/empty summaries |
| A3 | Event type enum valid | No invalid `event_type` values |

---

## 8. Sign-off

| Role | Section | Sign-off (name / date / SHA) |
|---|---|---|
| Pair 2 / FS-80 | §1 | |
| Security + QA 2 | §2, §6 | |
| Platform | §4 | |
| Pair 2 / founder delegate | §5 | |
| Incident commander | All | |

Drill **complete** only when FS-83 board acceptance criteria #3–#5 are satisfied with timestamps and gap log.
