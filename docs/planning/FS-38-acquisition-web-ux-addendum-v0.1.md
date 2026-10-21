# FS-38 — Acquisition web contract & idempotency UX addendum `v0.1`

**Status:** Preflight / normative for FS-17b — **no implementation**; **FS-17..20 remain Backlog** until PM marks Ready after §6 blockers in `revenue-agent-pair2-v0.1.md`.  
**Base SHA:** `12b23226c0e0c199626940117fc7f0fa89f87375` (`main`)  
**Parent contract:** `docs/contracts/revenue-agent-pair2-v0.1.md`  
**Joint idempotency:** `docs/planning/FS-38-pair2-joint-ack.md` §2  
**Web checklist:** `docs/planning/FS-38-pair2-web-ui-checklist.md`  
**Dev C alignment:** Request/response shapes match `apps/api/src/routes/public/booking/schemas.ts`, `packages/types/src/booking-request.types.ts`, and proposed `InquiryIntakeV1` (contract §4.1).

---

## 1. Purpose

This addendum specifies **customer acquisition web** behavior for Pair 2 v0.1: direct inquiry (booking-shaped intake), **verified vs unavailable capacity**, operator **estimate revision** (distinct from public approve), consent, duplicate submit / idempotency UX, error states, and **request ↔ response field mapping** for Dev C’s adapter. It does not authorize code changes.

---

## 2. Direct inquiry flow (v0.1 transport)

### 2.1 Journey (normative @ implementation)

| Phase | Web route | Step key | API | Notes |
|-------|-----------|----------|-----|-------|
| Land | `/book/{slug}?src=` | — | `GET /api/v1/public/booking/{slug}` | `src` query → submit `?src=` (enum); invalid `src` → server `direct` |
| Location | `/book/{slug}` | `location` | `POST .../check-zip` | Body: `{ zip }` |
| Service | `/book/{slug}/service` | `service` | — | UI-only |
| Schedule | `/book/{slug}/schedule` | `schedule` | `GET .../availability?zip=&date=` | Empty array = no slots UX |
| Contact | `/book/{slug}/contact` | `contact` | — | Consent checkboxes |
| Review | `/book/{slug}/confirm` | `confirm` | `POST .../submit?src=` + `Idempotency-Key` | FS-17 |
| Success | `/book/{slug}/confirmed?ref=` | — | `GET .../confirmation/{ref}` | Poll confirmation view |

**Product label:** FS-9 Crisp frames treat this as **inquiry / request** (M01 `7:262`, M02 `7:283`); code today says “booking” — copy alignment is FS-9 + FS-17b, not a new API.

**FS-17 inquiry entity:** No `POST /inquiries`. Submit body remains `SubmitBookingRequestSchema`; response adds optional `inquiry: InquiryIntakeV1` (joint ACK R7).

### 2.2 `InquiryIntakeV1` adapter mapping (submit success → `inquiry`)

| `InquiryIntakeV1` field | Source @ submit | Rule |
|-------------------------|-----------------|------|
| `id` | New UUID or `booking_requests.id` | FS-3 ADR; v0.1 may equal `bookingRequest.id` |
| `companyId` | Company from slug | From JWT-less slug resolution |
| `channel` | `"web_form"` | Fixed for public flow |
| `sourceAttribution` | `booking_requests.source` | From `deriveSource(?src=)` |
| `attributionProvenance` | `"query_param"` if `?src=` used | Else `"unknown"` until FS-11 |
| `contact.*` | Submit body names/phone/email | Normalized server-side |
| `property` | address lines, city, state, zip | From submit body |
| `intentText` | `customerNotes` + service labels | Concat or notes-only — **open Q1** |
| `classifiedIntent` | — | FS-17 AI; omit @ phase-1 |
| `serviceability` | `checkZipCoverage` at submit | `in_area` if covered; else submit rejected |
| `consent.smsAppointments` | `smsConsentAppointments` | Default **false** @ impl (W-C-01) |
| `consent.smsMarketing` | `smsConsentMarketing` | Default **false**; UI must collect (W-C-02) |
| `consent.capturedAt` | Server `now` | ISO |
| `consent.captureSurface` | `"book/contact"` | |
| `status` | `"open"` | Map from `bookingRequest.status` — **open Q2** |
| `linkedBookingRequestId` | `bookingRequest.id` | Always set |
| `linkedCustomerId` | Created/matched customer | If created |
| `dedupeKey` | FS-3 policy | Optional on response |

Existing response fields **unchanged** for web compatibility:

```typescript
// Today + v0.1 (schemas.ts submitBookingRouteSchema)
{
  bookingRequest: { id, referenceNumber, status },
  confirmation: { referenceNumber, status, companyName, scheduledStart, scheduledEnd },
  inquiry?: InquiryIntakeV1  // FS-17 — additive
}
```

**HTTP status (FS-17):** First idempotent write **201**; idempotent replay **200** (joint §2). OpenAPI schema should document both (Dev C).

---

## 3. Verified-capacity handoff (in-area, schedulable path)

### 3.1 Definition

**Verified capacity** = customer may proceed through service → schedule → contact → submit:

1. `POST .../check-zip` returns `{ covered: true, techCount: N }` where:
   - `N > 0` → techs serve ZIP, or
   - `N === 0` but `booking_settings.allowZipOverflow === true` → `covered: true` (overflow pool).
2. `GET .../availability` may return windows (uses tech pool or full company pool when overflow).
3. `POST .../submit` re-checks coverage; rejects if `covered: false` (**409** `CONFLICT` today: “outside the current booking area”).

### 3.2 Web UX (target @ FS-17b)

| State | UI (Figma / code target) | API evidence @ `12b23226` |
|-------|--------------------------|---------------------------|
| ZIP check success, `techCount > 0` | Green banner “we serve {zip}”, `{N} technicians…” | `BookingFlowClient` location step |
| ZIP check success, overflow (`techCount === 0`, covered) | Same green path; optional subcopy “routed to nearest available tech” — **open Q3** | `checkZipCoverage` sets `covered` true when `allowZipOverflow` |
| Availability loading | M03-style `aria-live` region | Spinner only today |
| Slots listed | User picks date/window or “first available” | `availability[].date/window/start/end` |
| Submit success | M02 **inquiry received — not scheduled** unless `autoConfirm` + scheduled times | `BookingConfirmed` — **misaligned** with M02 |
| Operator scheduling handoff (FS-21) | Out of web scope; receipt = `booking_requests` + events | `booking.requested` emitted |

### 3.3 Handoff to scheduling (preflight only)

Pair 3 **FS-21** consumes `booking_requests` (and future `inquiry` projection). Web must expose on success:

- `referenceNumber` (primary customer-facing id)
- `bookingRequest.status` (`pending` vs `confirmed` if `autoConfirm`)
- `confirmation.scheduledStart/End` when auto-confirm created a job

Web must **not** imply a firm appointment when `status === "pending"` and `scheduledStart === null` (W-C-05).

---

## 4. Unavailable-capacity path (out of area / no submit)

### 4.1 ZIP not served (`covered: false`)

**Server:**

- `check-zip`: `{ covered: false, techCount: 0 }` when no tech zips match and `allowZipOverflow` is false.
- `availability`: `[]` when no techs and no overflow.
- `submit`: **409** `CONFLICT` — “outside the current booking area”.

**Web @ `12b23226`:**

- Sets `zipNotServed`, toast, shows email capture card.
- Does **not** advance to address/service if user only sees not-served card (address block requires `zipVerified` from `setZipCoverage(covered, …)` — when not covered, `zipVerified` stays false).

**Target @ FS-17b:**

| ID | Behavior | Figma |
|----|----------|-------|
| W-CAP-01 | Block full funnel when `!covered` after check | M01 location |
| W-CAP-02 | `POST .../email-capture` `{ zip, email }` | Inline card (today) |
| W-CAP-03 | Success toast + clear email field | Today |
| W-CAP-04 | No `Idempotency-Key` on email-capture (not in scope) | — |
| W-CAP-05 | Persist interest — **open Q4** (`captureBookingInterest` returns success but **no DB write** @ SHA) | |

### 4.2 In-area but no availability slots

**Server:** `GET availability` returns `[]` (e.g. no schedule slots, all booked).

**Web @ SHA:** Message “No slots… Try another date”; user can still pick date manually and proceed — submit does not require a selected slot.

**Target:**

| ID | Behavior |
|----|----------|
| W-CAP-06 | Allow submit with `preferredWindow: "first_available"` and no slot selection (matches server defaults) |
| W-CAP-07 | Optional warning copy before confirm: “We’ll contact you to schedule” — aligns M02 |
| W-CAP-08 | If company disables booking entirely — **open Q5** (only 404 on bad slug today) |

### 4.3 Overflow path edge case

User in non-tech ZIP with `allowZipOverflow: true`:

- `covered: true`, `techCount: 0` → UI shows “0 technicians” if copy uses `techCount` literally — **open Q3** (wording).
- Availability uses **all** company technicians as pool (`booking.service.ts` `getBookingAvailability`).

---

## 5. Estimate revision (owner — FS-19 adjacent, not public approve)

Distinct from **customer** `GET/POST /api/v1/public/estimates/{token}` (approve/decline).

| Aspect | Owner revise | Public approve |
|--------|--------------|----------------|
| Auth | JWT + `companyId` | Token only |
| Route | `POST /api/v1/estimates/{id}/revise` | `POST /api/v1/public/estimates/{token}` |
| Web | `useReviseEstimate` → `(app)/estimates/*` | `(public)/approve/[token]` after FS-36 |
| Effect | New estimate row, prior → `revised`, new `draft` | Customer accepts tier → `approved` |
| Acquisition web | **No** customer UI in revise path | Link from email/SMS via `buildEstimatePublicPath` |

**FS-19 agent proposal:** Agent may propose line items → draft estimate; **human** `sendEstimate` still required. Revise is operator-initiated after customer feedback — not part of public booking funnel.

**Web checklist cross-ref:** W-E-* (FS-36), W-P-* (public token). **Gated:** FS-36 before public approve URLs; FS-19 before agent proposal surfaces.

---

## 6. Consent (normative UX)

Aligned with contract §4.0 and joint ACK R10.

### 6.1 Fields (submit body ↔ schema)

| Body field | Zod | Default @ server if omitted | UI default @ impl |
|------------|-----|----------------------------|-------------------|
| `smsConsentAppointments` | optional boolean | `false` | **unchecked** (W-C-01) |
| `smsConsentMarketing` | optional boolean | `false` | **unchecked** + visible (W-C-02) |

### 6.2 Copy rules

| Condition | Confirm step | Success step |
|-----------|--------------|--------------|
| Appointment SMS **checked** | May list appointment SMS in “what happens next” | May mention confirmation text |
| Appointment SMS **unchecked** | Must **not** promise “Confirmation SMS within 2 hours” (W-C-04) | No SMS promises (W-C-05) |
| Marketing checked | Disclaimer for promos (FS-8 matrix) | No auto-enroll copy |

**Figma:** A6 `aria-live` on consent summary (W-C-07); M05 `7:297` opt-out blocked — post FS-8.

### 6.3 Server send gate (Dev C — not web)

Worker must not enqueue `send-booking-confirmation` when `smsConsentAppointments === false` (N-R2-05). Web only sends honest flags.

---

## 7. Duplicate submit & idempotency UX

Normative: `FS-38-pair2-joint-ack.md` §2. Summary for acquisition web:

### 7.1 Idempotency (same confirm session)

| Trigger | HTTP | UI frame | Action |
|---------|------|----------|--------|
| First successful submit | **201** | Navigate to confirmed | Store `ref`; clear key optional after nav |
| Retry same key + same body | **200** | Same `referenceNumber` | W-ID-07: single navigation |
| Double-click while pending | — | M03 `7:289` | W-ID-04/05: disabled + `aria-busy` |
| Network/5xx retry | — | M03/M04 `7:293` | W-ID-06: same key, “Still working…” |
| Same key, body changed | **409** `CONFLICT`, `fields.reason = "idempotency_payload_mismatch"` | M07 `7:307` | W-ID-08: clear `sessionStorage` key, restart |
| Missing header | Legacy duplicate rows | — | Pre-FS-17 behavior |

**Storage key:** `sessionStorage['fsm:idempotency:' + slug]` (R8).

### 7.2 Duplicate window (FS-3 — not idempotency)

| Trigger | HTTP (proposed) | UI frame | Action |
|---------|-----------------|----------|--------|
| Second submit, **different** keys, same phone/email in window | **409**, `fields.reason = "duplicate_inquiry"` + existing `referenceNumber` | M06 `7:301` | W-ID-09: show existing ref, no second row |

Policy window and storage are **FS-3**; web only renders M06 when API signals duplicate.

---

## 8. Error state catalog (acquisition web)

Standard error envelope: `{ error, message, requestId, fields? }` (`ErrorCode` enum).

### 8.1 By endpoint

| Endpoint | HTTP | `error` | Web UX | Figma |
|----------|------|---------|--------|-------|
| `GET .../booking/{slug}` | 404 | `NOT_FOUND` | Full-page “Booking page unavailable” | — |
| `GET .../booking/{slug}` | 5xx | `INTERNAL_ERROR` | Same + retry | — |
| `POST .../check-zip` | 400 | `VALIDATION_ERROR` | Toast “Coverage check failed” | — |
| `POST .../check-zip` | 404 | `NOT_FOUND` | Treat as unavailable page | — |
| `GET .../availability` | 400 | `VALIDATION_ERROR` | Inline error on schedule step | — |
| `GET .../availability` | 200 `[]` | — | “No slots…” (not API error) | — |
| `POST .../email-capture` | 400 | `VALIDATION_ERROR` | Toast “Could not save…” | — |
| `POST .../submit` | 400 | `VALIDATION_ERROR` | Toast + field highlights if `fields` | M04 |
| `POST .../submit` | 404 | `NOT_FOUND` | Toast / unavailable | M04 |
| `POST .../submit` | 409 | `CONFLICT` | Branch on `fields.reason` (see below) | M06/M07 |
| `POST .../submit` | 429 | `RATE_LIMIT` or similar | Toast + backoff | M04 |
| `POST .../submit` | 5xx | `INTERNAL_ERROR` | W-ID-06 retry same key | M03/M04 |
| `GET .../confirmation/{ref}` | 404 | `NOT_FOUND` | Success page with pending ref only | — |

### 8.2 `POST .../submit` 409 branches

| `fields.reason` | Meaning | UI |
|-----------------|---------|-----|
| _(absent)_ + message zip | Out of area at submit time | Toast; suggest re-check ZIP (W-CAP-01) |
| `idempotency_payload_mismatch` | Key reused after edit | M07 stale session |
| `duplicate_inquiry` | FS-3 window | M06 duplicate |
| Auto-confirm no tech | “No technicians…” | M04 + call office CTA — **open Q6** |

### 8.3 Public estimate (post–FS-36)

| Case | HTTP | UI |
|------|------|-----|
| Invalid token | 404 | W-P-01 empty state |
| Expired | 4xx per API | W-P-02 |
| Approve after decline | 409 | Inline error |

---

## 9. Request / response reference (Dev C lock)

### 9.1 `POST .../check-zip`

**Request:** `{ "zip": string }`  
**Response 200:** `{ "covered": boolean, "techCount": number }`

### 9.2 `POST .../email-capture`

**Request:** `{ "zip": string, "email": string }` (email validated)  
**Response 200:** `{ "success": true }`

### 9.3 `GET .../availability`

**Query:** `zip` (required), `date` (optional ISO date)  
**Response 200:** `{ "availability": [{ date, window, start, end, technicianIds }] }`

### 9.4 `POST .../submit`

**Query:** `src?` ∈ `google|facebook|instagram|yelp|direct|website|qr_code`  
**Headers (FS-17):** `Idempotency-Key: <uuid>`  
**Body:** `SubmitBookingRequestSchema` (see `schemas.ts` lines 51–72) — web `booking.hooks` passes record matching `SubmitBookingRequestInput` in `@fsm/types`.

**Response 201/200:** `bookingRequest` + `confirmation` (+ optional `inquiry`).

### 9.5 `GET .../confirmation/{ref}`

**Response 200:** `{ confirmation: BookingConfirmationView }`

---

## 10. Implementation gates (unchanged)

| Ticket | Gate |
|--------|------|
| FS-17 | FS-3 ADR, FS-8 consent matrix (partial), joint idempotency |
| FS-18..20 | FS-10/12, FS-14, FS-8, FS-19 deps per contract §6 |
| FS-17b web | FS-36 for estimate links only; booking can ship with 2a |

**Do not publish or implement** FS-17..20 product code from this document alone.

---

## 11. Unresolved questions (for PO / Tech Lead / Dev C)

| ID | Question | Blocks |
|----|----------|--------|
| Q1 | `InquiryIntakeV1.intentText`: `customerNotes` only vs include service category/type? | Copy + AI classify |
| Q2 | Map `bookingRequest.status` (`pending`/`confirmed`) to `inquiry.status` enum | Adapter |
| Q3 | Overflow UX when `techCount === 0` but `covered: true` | W-CAP copy |
| Q4 | `email-capture` persistence (table? marketing consent?) — today no-op store | W-CAP-05 |
| Q5 | Global “booking disabled” flag vs 404 slug | Settings product |
| Q6 | Auto-confirm failure mid-submit — dedicated `fields.reason`? | Error UX |
| Q7 | FS-3 duplicate window duration + whether to return existing `referenceNumber` in body | M06 + AT-ID-03 |
| Q8 | FS-9: single-scroll M01 vs multi-step — refactor scope for FS-17b | Design PASS |
| Q9 | `autoConfirm` default for pilot tenants — affects M02 “not scheduled” | Ops |
| Q10 | Add `200` to OpenAPI for submit replay vs only 201 | Dev C schema PR |

---

## Changelog

- **v0.1 (2026-10-20):** Initial acquisition-web + idempotency UX addendum @ `12b23226`; Dev D; aligned with Dev C joint ACK.
