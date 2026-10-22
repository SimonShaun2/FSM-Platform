# FS-40 preflight packet — import, outbox, and outcome measurement

**Status:** PROPOSED (Batch 3 — `BATCH-FS3-GROWTH-002` slot 1)  
**Notion:** [P0 import, outbox, and outcome measurement preflight](https://app.notion.com/p/3ff317b92d1581208d7dd7b7e1f4580e)  
**Contract:** `docs/contracts/fsm.control-plane.import-outbox-attribution.v1.0.0.md`  
**Exact base SHA:** `7f1e6328e1a5ba54c7477b0cce0496502235f1e0` (`dev`, post Batch 2 merge PR #36)

## Acceptance checklist (FS-40 card)

| # | Criterion | Evidence in this PR |
|---|-----------|---------------------|
| 1 | Base SHA, files, behavior, risks | § Inventory below |
| 2 | Versioned contract, consumers, test matrix, blockers | Contract doc + § Test matrix + § Blockers |
| 3 | Implementation split, branches, merge order | § Downstream split |
| 4 | Local commands / results | § Verification |

**Explicit non-goals for this ticket:** no `integration_outbox` migration, no outbound vendor sends, no FS-11/15/29 product code, no Jobber/HCP/ZenMaid matrix.

## Inventory @ `7f1e632`

### Import (FS-11 precursor)

| Path | Role |
|------|------|
| `apps/api/src/services/import.service.ts` | Session CRUD, rollback, queue execute |
| `apps/worker/src/processors/csv-import.processor.ts` | Mapping, validation, ingest |
| `packages/types/src/data-import.contract.ts` | `fsm.data-import.v1` mirror types |
| `docs/contracts/fsm.data-import.v1.md` | Accepted import contract |
| `apps/api/src/routes/imports/fs-11-import.contract.test.ts` | Runnable FS-11 acceptance tests |

**Risks:** execute/validate job names include `Date.now()`; re-upload always new session; no outbox dedupe on row ingest.

### Booking & growth intake

| Path | Role |
|------|------|
| `apps/api/src/services/booking.service.ts` | Public submit, confirm, notifications enqueue |
| `apps/api/src/services/booking-in-platform.service.ts` | Slot hold / confirm guards (merged via PR #32) |
| `apps/api/src/routes/public/booking/public-booking-hold.test.ts` | Hold contract tests |

**Risks:** No `Idempotency-Key` on public submit (BK-01); `correlationId` not persisted on `booking_requests` yet.

### Outbound (FS-15 precursor)

| Path | Role |
|------|------|
| `packages/jobs/src/queues.ts` | `fsm:notifications` |
| `apps/worker/src/processors/notifications.processor.ts` | Twilio/SendGrid send |
| `apps/api/src/services/estimate.service.ts` | Enqueues estimate-sent notifications |

**Risks:** Not transactional with domain writes; campaign path separate from booking confirmations.

### Outcome measurement (FS-29 / FS-22 precursor)

| Path | Role |
|------|------|
| `apps/api/src/services/job-source-reporting.service.ts` | Channel attribution rollup |
| `apps/api/src/routes/reporting/` | `GET /reporting/job-sources` |
| `packages/types/src/job-source-reporting.types.ts` | Channel enums |

**Risks:** Tiles must not claim contribution profit until FS-22; `importSessionId` ≠ unknown bucket.

## Test matrix (contract gates — skipped until downstream Ready)

| ID | Area | Intent |
|----|------|--------|
| CSV-G01 | Import | Same `idempotencyKey` + same hash → single row |
| CSV-G02 | Import | Partial batch → collected errors, no abort |
| CSV-G07 | Import | Rollback by `importSessionId` |
| CSV-G08 | Import | Cross-tenant session → `NOT_FOUND` |
| BK-G01 | Booking | Submit idempotency replay |
| BK-G04 | Booking | `correlationId` stable on `booking.requested` |
| OB-G01 | Outbox | Retry backoff → `dead` |
| OB-G05 | Outbox | Redacted `lastError` in activity payload |
| P-01 | Paired | `bookingRequestId` only in `entityRefs` |
| P-12 | Paired | No PII in idempotency keys |

Implementation: `apps/api/src/contracts/fs-40-import-outbox-attribution.gates.test.ts` (`describe.skip`).

## Dependency / decision blockers

| ID | Blocker | Owner |
|----|---------|-------|
| FS-3 | `integration_outbox` table ADR, event enum names (D-01, D-02) | Tech Lead |
| FS-5 | Direct-job segment rubric for `AttributionV1.segment` | PM/CoS |
| FS-10/12 | Canonical tenant/lead context on booking submit | Pair 1 |
| Dual ACK | Dev I + Dev J **ACCEPTED** on contract thread | Pair 5 |

Until cleared: **FS-11, FS-15, FS-29 remain Backlog** for implementation authority.

## Downstream implementation split (do not start until Ready)

| Order | Branch (proposed) | Ticket | Scope |
|-------|-------------------|--------|--------|
| 1 | `cursor/fs-11-import-outbox-446d` | FS-11 | `integration_outbox` + CSV row idempotency + worker hooks |
| 2 | `cursor/fs-15-comms-outbox-446d` | FS-15 | Outbox worker for sms/email; no inline `notificationsQueue` from API |
| 3 | `cursor/fs-29-attribution-tiles-446d` | FS-29 | Command Center read models (blocked on FS-22) |

**Merge order:** FS-11 → FS-15 (parallel API types only after #1 schema) → FS-29 after FS-22 reporting contract ACK.

## Verification (local)

```bash
pnpm --filter @fsm/types test -- src/import-outbox-attribution/v1/schemas.test.ts
```

## Growth-first note

Attribution and job-source reporting on `dev` already support **growth channel** rollups (`own_website`, `booking`, etc.). This preflight ties import and booking intake to a **single attribution envelope** so FS-22/FS-29 can measure direct vs repeat without external FSM adapters.
