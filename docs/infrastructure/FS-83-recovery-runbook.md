# FS-83 — Service recovery runbook (provider-neutral)

**Status:** Draft for isolated drill — **not exercised** on this branch  
**Companion:** [FS-83-critical-services-inventory.md](./FS-83-critical-services-inventory.md) (recovery order), [FS-83-drill-reconciliation-checklist.md](./FS-83-drill-reconciliation-checklist.md) (verification)

---

## 1. Purpose and trigger

Use this runbook when:

- Primary region or provider incident makes production unavailable, or
- Catastrophic data corruption requires restore from backup, or
- FS-83 **continuity drill** in an isolated environment (preferred first execution).

**Out of scope for this document:** Provider-specific click paths (add appendices after FS-93 ADR). No production destructive steps without founder authorization.

---

## 2. Prerequisites checklist

| # | Prerequisite | Owner ticket | Evidence required |
|---|---|---|---|
| P1 | Approved RPO/RTO recorded | FS-83 | Notion FS-83 business sign-off |
| P2 | Platform ADR (who backs up what) | FS-93 | ADR link |
| P3 | Isolated environment exists | FS-75 | Topology diagram, distinct credentials |
| P4 | DB backup restore procedure tested | FS-80 | Restore log + checksum |
| P5 | Secret bundle for drill | FS-76 | Injection path, no secrets in git |
| P6 | Object storage restore or bucket clone plan | FS-85 / FS-93 | Sample object restore |
| P7 | Incident roles assigned | PO / CoS | Names in FS-83 evidence |
| P8 | Stripe/Twilio **test** mode keys for drill | FS-76 | No live money in drill |

If any P1–P8 is open, limit execution to **tabletop walkthrough** only.

---

## 3. Roles and communications

| Role | Responsibility |
|---|---|
| **Incident commander** | Declares start/end, go/no-go for webhook ingress |
| **Platform lead** | Runtime deploy, DNS drill hosts, Redis |
| **DB owner (Pair 2)** | Restore PG, migration verify |
| **Security** | Tenant isolation sign-off before traffic |
| **QA 2** | Executes reconciliation checklist |
| **Product Owner** | Customer comms approval if production-impacting |

Escalation path: _record in FS-83 evidence after PO assignment._

---

## 4. Recovery procedure (phased)

Follow phases in [inventory §6](./FS-83-critical-services-inventory.md#6-recovery-order-recommended). Below expands operational steps at a provider-neutral level.

### Phase 0 — Declare and isolate

1. Open incident channel; record start time (UTC) for later RTO measurement.
2. Confirm drill vs production: **drill must use FS-75 isolated stack only**.
3. Disable or block production webhook delivery at provider dashboard if failing over (production only — founder approval).

### Phase 1 — Rehydrate secrets

1. Load drill environment variables via approved store (FS-76) — all keys in `packages/config/src/env.ts` and `.env.example`.
2. Use **distinct** `JWT_SECRET` / `JWT_REFRESH_SECRET` in drill to invalidate production tokens if a copy of prod backup is mounted.
3. Confirm `NODE_ENV`, `APP_URL`, `NEXT_PUBLIC_API_URL`, and CORS origins match drill hostnames only.

### Phase 2 — Restore PostgreSQL

1. Restore latest **approved** backup snapshot into drill instance (procedure: FS-80 runbook appendix — TBD).
2. Record backup timestamp → compute **actual RPO** vs approved target.
3. Run migration status check: application code at drill git SHA must match schema expected by `packages/db` migrations.
4. Do **not** run destructive migrations during incident without Pair 2 + Tech Lead sign-off.

### Phase 3 — Restore object storage

1. Restore or attach bucket containing objects referenced by `file_attachments.file_url` and `job_photos`.
2. Sample N files per tenant from checklist; verify download via storage adapter (not public guessing).
3. Record object count / missing key report.

### Phase 4 — Redis / queues

1. Prefer **empty Redis** for drill unless FS-93 mandates persistence restore.
2. Document queue depths at failure time if known (production); expect loss of in-flight jobs.
3. Keep workers **stopped** until Phase 8 reconciliation passes.

### Phase 5 — Deploy application tier

1. Deploy `apps/api`, `apps/webhook` (ingress still blocked), `apps/web` at known git SHA.
2. Smoke: API starts without env validation errors; authenticated health/readiness per FS-75 contract.
3. Web loads login; public routes return expected errors without API.

### Phase 6 — Data reconciliation (gate)

1. Run [FS-83-drill-reconciliation-checklist.md](./FS-83-drill-reconciliation-checklist.md) and `scripts/recovery/drill-reconciliation.sql`.
2. **Stop** if any P0 tenant or payment invariant fails.

### Phase 7 — Workers

1. Deploy `apps/worker` at reduced `WORKER_CONCURRENCY`.
2. Inspect BullMQ queues under prefix `fsm`; clear poison messages per FS-77 operational policy when available.
3. Replay only idempotent jobs; do not mass-retry notifications until comms policy approves.

### Phase 8 — Webhooks and edge

1. Point **test** Stripe/Twilio endpoints to drill webhook URL.
2. Send synthetic webhook samples; verify idempotency (`apps/webhook` stripe idempotency helpers).
3. Validate DNS/TLS for drill hostnames (FS-78).

### Phase 9 — Smoke workflows

Minimum operator paths (adjust per approved RLO):

- Login as test company user
- List customers and open one job
- View estimate/invoice read-only
- Upload/download one attachment (if FS-85 ready)

Record pass/fail and duration → **actual RTO** vs approved.

---

## 5. Rollback / abort

| Condition | Action |
|---|---|
| Wrong backup mounted | Tear down DB; re-restore from earlier snapshot |
| Cross-tenant check fails | Abort worker/webhook ingress; Security incident |
| Payment duplicate detected | Stop workers; reconcile Stripe vs `payments` before resume |
| Drill overruns maintenance window | Document gaps; reschedule — do not claim FS-83 complete |

---

## 6. Post-incident / post-drill

1. Complete FS-83 gap log: timing, failed checks, follow-up tickets.
2. Update FS-80 / FS-93 docs with provider-specific appendices learned.
3. Rotate any drill credentials that touched production-derived data (FS-76).
4. **Do not** mark FS-83 Done until acceptance criteria on board are met with evidence links.

---

## 7. Provider appendix placeholders (FS-93)

| Provider area | Appendix status |
|---|---|
| PostgreSQL backup/restore CLI or UI steps | `TBD — FS-80 + FS-93` |
| R2 versioning / lifecycle / restore | `TBD — FS-93` |
| Redis persistence | `TBD — FS-93` |
| Railway/Vercel deploy rollback | `TBD — FS-93` |
| Cloudflare DNS failover | `TBD — FS-78` |
