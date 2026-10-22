# FSM control plane — import, internal outbox, and attribution v1.0.0

| Field | Value |
|--------|--------|
| **Contract ID** | `fsm.control-plane.import-outbox-attribution.v1.0.0` |
| **Ticket** | [FS-40](https://app.notion.com/p/3ff317b92d1581208d7dd7b7e1f4580e) (preflight); downstream **FS-11**, **FS-15**, **FS-29** |
| **Status** | **PROPOSED** — Pair 5 preflight; dual ACK required before downstream implementation |
| **Types** | `packages/types/src/import-outbox-attribution/v1/` (`AttributionV1`, `AdapterOperationV1`) |
| **Base SHA (inventory)** | `7f1e6328e1a5ba54c7477b0cce0496502235f1e0` on `dev` |

## North star

**Renvani is the system of record.** This contract covers **one-way CSV import**, **internal comms/payment outbox** (Twilio/SendGrid/Stripe — no live sends in preflight), and **growth attribution** for direct jobs. It explicitly **excludes** outbound handoff to Jobber, Housecall Pro, ZenMaid, or any external scheduler write adapter.

## Scope map (current `dev` behavior)

| Area | Primary code | Today | Risk / gap |
|------|----------------|-------|------------|
| CSV import | `import.service.ts`, `csv-import.processor.ts`, `docs/contracts/fsm.data-import.v1.md` | `import_sessions` lifecycle, rollback by `importSessionId`, formula sanitization | No session-level `idempotencyKey`; execute job id uses timestamp suffix (replay risk CSV-01) |
| Public booking | `booking.service.ts`, `booking-in-platform.service.ts` | Submit + hold/confirm on `dev`; `notificationsQueue` for confirmations | Submit idempotency header not enforced (BK-01); attribution segment **unknown** until FS-5 rubric |
| Outbound comms | `notifications.processor.ts`, `estimate.service.ts` (send estimate) | BullMQ `fsm:notifications` direct enqueue | Not a transactional outbox; retries are queue-level only |
| Attribution reporting | `job-source-reporting.service.ts`, `GET /api/v1/reporting/job-sources` | Channel rollup from `jobs` / `customers.leadSource` | `importSessionId` does not map to “unknown”; no `AttributionV1` on wire yet |
| Audit | `activity_events` | Append-only domain events | Audit-only — **not** idempotent outbox dedupe |

## Normative shapes (v1)

### `AttributionV1` (required on every `AdapterOperationV1`)

- `schemaVersion: 1`
- `segment`: `imported` \| `unknown` (booking segment finalized under FS-5)
- `provenance`: `{ adapterId, externalRef, importSessionId? }` — **`bookingRequestId` is forbidden here**; use `entityRefs[]`
- `entityRefs[]`: `{ entityType, entityId }` (e.g. `booking_request`, `customer`, `job`)

### `AdapterOperationV1` (future `integration_outbox` row)

- Tenant: `companyId` column (never trust body `companyId` on authenticated routes)
- `idempotencyKey` = `{adapterId}:{externalRef}` (or opaque UUID); unique `(companyId, kind, idempotencyKey)`
- `correlationId`: UUID v4 minted at entry; stable across retries; never paired with a second idempotency key
- `kind`: `csv_import` \| `public_booking` \| `sms_outbound` \| `email_outbound` \| `stripe_connect`
- `status`: `pending` → `processing` → `succeeded` \| `dead`
- `payload`: adapter-specific JSON; `schemaVersion: 1` inside payload when nested

### Adapters (v1 names)

| `adapterId` | Entry surface | `externalRef` example |
|-------------|---------------|------------------------|
| `manual_csv_v1` | CSV import worker row ingest | `importSessionId:rowNumber` |
| `public_booking_v1` | `POST /public/booking/:slug/submit` | `booking_request.referenceNumber` |

## Consumers (planned)

| Consumer | Reads | Writes |
|----------|-------|--------|
| FS-11 import worker | `AttributionV1` on ingest | `integration_outbox` + domain rows + `activity_events` |
| FS-15 notifications worker | Outbox `sms_outbound` / `email_outbound` | Provider adapters; `message.sent` event |
| FS-29 Command Center tiles | `job-source-reporting` + attribution joins | Read-only; blocked until FS-22 |
| FS-22 reporting API | Existing `job-source-reporting.service.ts` | Extend with `AttributionV1` joins (future) |

## Retry & failure matrix (summary)

See `docs/planning/FS-40-preflight-packet.md` for gate IDs **CSV-G**, **BK-G**, **OB-G**. Contract tests are registered in `apps/api/src/contracts/fs-40-import-outbox-attribution.gates.test.ts` and remain **skipped** until FS-11/15/29 are Ready.

## Non-goals

- Bi-directional sync or `integration.write` to external FSM tools
- Live SMS, email, or payment sends from this preflight PR
- Command Center FS-29 UI implementation

## Related contracts

- `fsm.data-import.v1` — CSV operator import (FS-11)
- `agent-control-plane@1.0.0` — agent proposals and tenant context (FS-37)
- Job source reporting types — `packages/types/src/job-source-reporting.types.ts` (FS-22 slice on `dev`)
