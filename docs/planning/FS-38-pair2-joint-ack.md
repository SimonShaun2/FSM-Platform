# FS-38 — Pair 2 joint ACK (Dev C ↔ Dev D)

**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375`  
**Date:** 2026-10-20  
**Scope:** Preflight only — **FS-17..20 remain Backlog** until PM marks Ready after FS-3, FS-8, FS-36, FS-5, FS-10/12, FS-14, FS-11, FS-2.

## Joint verdict

| Artifact | Dev C | Dev D | Joint status |
|----------|-------|-------|----------------|
| `revenue-agent-pair2-v0.1.md` | ACK with corrections | CONTRACT ACK v0.1 | **JOINT ACK** |
| Idempotency + duplicate coordination (below) | PROPOSED v0.1 | IDEMPOTENCY ACK v0.1 + 2 corrections | **JOINT ACK with corrections** |
| `FS-38-pair2-web-ui-checklist.md` | Informed (API owns replay) | Author | **Aligned** — W-ID mapped to AT-* |
| N-R2-07 / AT-ID-* implementation tests | API + worker owner | Web + E2E owner | **Joint acceptance matrix §3** |

No downstream revenue implementation authorized by this ACK.

---

## 1. Itemized reconciliation (open cases)

| # | Topic | Dev C (FS-38 page) | Dev D (web checklist) | Resolution | Owner @ impl |
|---|--------|-------------------|----------------------|------------|--------------|
| R1 | Transport | `Idempotency-Key` header on `POST public/booking/{slug}/submit` only | W-ID-03 same | **ACK** | Dev D header; Dev C handler |
| R2 | Scope | Unique `(companyId, key)` 24h TTL | W-ID-01/02 session-scoped UUID | **ACK** — web mints once per confirm attempt; server enforces 24h | Both |
| R3 | Replay success | Same key + same payload hash → original booking, no second row/jobs | W-ID-07 navigate once; AT-ID-01 | **ACK** — HTTP **201** first write, **200** replay, identical JSON body | Dev C |
| R4 | Payload conflict | Same key + different hash → `409` | W-ID-08; AT-ID-02 | **ACK with correction** — use `ErrorCode.CONFLICT` @ v0.1; `fields.reason = "idempotency_payload_mismatch"` (no `IDEMPOTENCY_CONFLICT` enum on main yet; add in FS-17 types PR if Security prefers distinct code) | Dev C |
| R5 | Missing header | (implicit: legacy non-idempotent) | Web always sends key when FS-17 ships | **ACK** — omitting header keeps today’s behavior until web ships; no breaking change @ FS-17 API-only deploy | Dev C |
| R6 | `dedupeKey` vs idempotency | Analytics / soft dedupe; does not replace key | W-ID-09 / AT-ID-03 separate UX | **ACK** — duplicate *window* policy is **FS-3**; may return `409` `fields.reason = "duplicate_inquiry"` with existing `referenceNumber`; **not** idempotency replay | Dev C + PO |
| R7 | Response shape | `InquiryIntakeV1` projection | Today uses `bookingRequest` + `confirmation` | **ACK** — v0.1 response **adds** optional `inquiry: InquiryIntakeV1`; existing fields unchanged for web compatibility | Dev C |
| R8 | Payload hash canonicalization | Server normalizes submit body | W-ID-02 must not rotate key on retry | **ACK** — shared rules in §2; key minted on first confirm click; body edit + same key → R4 conflict UI | Dev D |
| R9 | Notification jobs | Replay must not enqueue | N-R2-07 worker count | **ACK** — assert in `booking.test.ts` + `notifications.processor.test.ts` | Dev C |
| R10 | Consent + SMS | N-R2-05 target; gate sends on flags | W-C-01..07 | **ACK** — UI defaults + copy in FS-17b; worker guard in FS-8/17a | Dev D + Dev C |
| R11 | FS-36 `/approve/{token}` | Link contract §3 | W-E-01..06 | **ACK** — no web estimate path work until FS-36 Ready | Dev D |
| R12 | Branch suffix | `-96e5` | Adopted in contract §8 | **ACK** | Pair 2 |

### Dev D corrections (accepted by Dev D; Dev C acknowledge on next touch)

1. **R4:** Do not require new `ErrorCode` enum in preflight; implementation uses `CONFLICT` + structured `fields.reason` unless Tech Lead adds `IDEMPOTENCY_CONFLICT` in FS-17.
2. **R8:** Revise W-ID-02 — persist **idempotency key** in `sessionStorage` at first submit attempt (not `bodyHash` as key name); body hash is server-only for R4.

### No open deltas (pair closed)

- §4.1 adapter-only (no `/inquiries` POST v0.1): both ACK.
- AT-ID-01..02: aligned with R3–R4.
- AT-ID-03: explicitly **out of** idempotency scope (R6).

---

## 2. Normative idempotency addendum `v0.1` (incorporated into contract)

### 2.1 Header

- Name: `Idempotency-Key`
- Value: UUID v4 string
- Required: **recommended** on public submit from web; optional for other clients until documented

### 2.2 Server behavior (`submitBookingRequest`)

1. Resolve `companyId` from slug.
2. If header absent → current behavior (non-idempotent).
3. If header present:
   - Compute `payloadHash` from **canonical JSON** of normalized submit input (sorted keys, normalized phone/email, trimmed strings; exclude `source` query from hash if passed only in query — **include** body `source` if present).
   - Lookup `(companyId, idempotencyKey)` not expired.
   - **Hit + same hash:** return stored response body, HTTP **200**, no DB insert, **no** `notificationsQueue.add`.
   - **Hit + different hash:** `409` `CONFLICT`, message human-readable, `fields.reason = "idempotency_payload_mismatch"`.
   - **Miss:** process submit, persist record `{ key, payloadHash, responseSnapshot, expiresAt: now+24h }`, HTTP **201**.

### 2.3 Web behavior (FS-17b)

| ID | Behavior |
|----|----------|
| W-ID-01 | `crypto.randomUUID()` on first confirm submit |
| W-ID-02 | `sessionStorage['fsm:idempotency:'+slug]` until success navigation |
| W-ID-03 | `api.post(..., { headers: { 'Idempotency-Key': key } })` |
| W-ID-04–05 | `disabled` + `aria-busy` while pending |
| W-ID-06 | Retry transient errors with **same** key |
| W-ID-07 | On 200/201 success, navigate to confirmed once |
| W-ID-08 | On R4 conflict, clear key + show M07-style copy |
| W-ID-09 | On R6 duplicate (FS-3), show M06 with existing ref |

### 2.4 Storage (FS-3 ADR)

Options: columns on `booking_requests` vs `idempotency_keys` side table. Preflight does not choose.

---

## 3. Joint acceptance matrix (duplicate / idempotency / compatibility)

| Test ID | Layer | File (future) | Pass criteria |
|---------|-------|---------------|---------------|
| AT-ID-01 | API | `apps/api/src/routes/booking/booking.test.ts` | Two POSTs same key+body → 201 then 200; one row; queue add count 1 |
| AT-ID-02 | API | same | Same key, different body → 409 + `fields.reason` |
| AT-ID-03 | API | same + FS-3 policy | Different keys, same phone — per ADR |
| AT-ID-01 | Web unit | `apps/web/src/components/booking/booking-idempotency.test.ts` | Key stable across retry mock |
| AT-ID-01 | E2E | `apps/web/e2e/acquisition/public-booking.spec.ts` | Double-click → one ref |
| N-R2-07 | API+worker | `booking.test.ts` + `notifications.processor.test.ts` | Subsumes AT-ID-01 queue assertion |
| N-R2-11 | Web unit | `apps/web/src/lib/route-access.test.ts` | `/approve` public; `/estimates/{uuid}` not public |
| N-R2-11 | E2E | `public-estimate-approve.spec.ts` | After FS-36 |
| N-R2-05 | API+web | `phase2-operations.test.ts` + consent UI tests | SMS job only if `smsConsentAppointments` |

**Harness:** `@fsm/web` test script is no-op @ `12b23226`; FS-2 before batch CI.

---

## 4. Partner sign-off

| Role | Statement | Date |
|------|-----------|------|
| Dev C | ACK with corrections (FS-38 page 2026-10-20); idempotency PROPOSED v0.1 | 2026-10-20 |
| Dev D | **JOINT ACK** — R1–R12 + idempotency addendum §2; corrections R4/R8 | 2026-10-20 |
| Dev C (counter) | _Pending only if rejects R4 enum or R6 split_ | — |

---

## 5. FS-38 card checklist update

| # | Criterion | Status after joint ACK |
|---|-----------|------------------------|
| 5 | Pair contract ACK | **Done** (both roles) |
| 6 | Idempotency addendum co-signed | **Done** (§2 + R1–R9) |
| — | FS-38 ticket **Done** | **Not claimed** — PM may keep In Review until artifacts pushed on `cursor/fs-38-contract-pair2-96e5` |
| — | FS-17..20 | **Backlog** unchanged |

## Evidence

```bash
git rev-parse HEAD  # 12b23226c0e0c199626940117fc7f0fa89f87375
# packages/types/src/errors.ts — no IDEMPOTENCY_CONFLICT (R4 correction)
```

No `pnpm test` run this turn.
