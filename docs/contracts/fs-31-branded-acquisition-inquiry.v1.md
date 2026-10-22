# FS-31 — Branded acquisition inquiry contract v1

| Field | Value |
|--------|--------|
| **Contract ID** | `fsm.branded-acquisition.inquiry.v1` |
| **Ticket** | [FS-31](https://app.notion.com/p/3ff317b92d1581ce81c4fcbcc16e9938) |
| **Handoff** | FS-17 (inquiry intake) / FS-18 (qualification) |
| **Transport** | Existing `POST /api/v1/public/booking/{slug}/submit` — no new inquiry route |

## Journey

| Step | Surface | Attribution |
|------|---------|-------------|
| Land | `/site/{bookingSlug}` | `src=website` on outbound links |
| Book | `/book/{slug}?src=website` | Full scheduling path (FS-21) |
| Inquire | `/site/{slug}/inquire?src=website` | Direct quote form → submit |
| Success | Inline confirmation | `booking_requests.referenceNumber` |

**Coexistence:** Copy states the Renvani page complements the operator’s existing site; no Jobber/HCP/ZenMaid sync.

## Submit body (inquiry path)

Same schema as `SubmitBookingRequestSchema`. Branded inquiry sets:

- `serviceCategory`: `"Cleaning"`
- `serviceType`: selected service card title
- `customerNotes`: prefixed `[Branded site inquiry]`
- `urgency`: `flexible`
- `preferredWindow`: `first_available`
- `smsConsentAppointments`: **required true** (UI blocks otherwise)
- `smsConsentMarketing`: optional checkbox

Headers: `Idempotency-Key` (UUID) on first submit from branded form.

Query: `?src=website` → `booking_requests.source` → FS-22 channel `own_website`.

## FS-17 / FS-18 handoff

1. Submit creates `booking_requests` row (system of record).
2. FS-17 adapter (future) projects `InquiryIntakeV1` on response — web already compatible via `bookingRequest` + `confirmation` shapes (`docs/planning/FS-38-acquisition-web-ux-addendum-v0.1.md`).
3. FS-18 consumes `POST /api/v1/revenue-inquiries/:bookingRequestId/response` (operator JWT) — out of customer web scope.

## Measurement (FS-35 / FS-22 alignment)

| Metric | Source @ v1 |
|--------|-------------|
| Direct jobs | `GET /api/v1/reporting/job-sources` → `own_website` channel |
| Acquisition cost | **Not in v1 UI** — FS-35 rubric uses operator-entered spend; jobs attributed via `source=website` |
| Inquiry volume | Count `booking_requests` where `source=website` and `customerNotes` contains `Branded site inquiry` |

## Non-goals

- Vercel deploy, custom DNS, live payments
- Outbound sync to incumbent FSM tools
