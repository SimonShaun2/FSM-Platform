# FS-58 — Public surface abuse controls (runbook)

**Owners:** Sofia (API), Ezra (Infra) · **Lifecycle:** Discover / Book  
**MVP P0:** Proxy and branded public paths must fail closed under abuse.

## Surfaces in scope

| Surface | Route prefix | Controls |
| --- | --- | --- |
| Public booking | `/api/v1/public/booking/*` | IP rate limit on `POST`; per-reference limit on slot-hold |
| Public estimates | `/api/v1/public/estimates/*` | Token-only access; no session |
| Growth website preview | `/api/v1/public/growth/*` | Slug-scoped reads; no cross-tenant ids in path |

## Rate limits (v1)

- **Booking submit / hold / inspect:** `checkPublicBookingIpRateLimit` — shared Redis counter per IP.
- **Slot hold:** `checkPublicSlotHoldReferenceRateLimit` — per `slug` + `referenceNumber`.

## Negative test matrix

Automated coverage:

- `apps/api/src/routes/public/booking/public-booking-hold.test.ts` — hold token tamper, expiry, reference mismatch, inspect-without-claim.
- `apps/api/src/routes/security/fs-92-tenant-isolation.test.ts` — unauthenticated tenant reads denied.

## Operator response

1. **429 spikes on booking:** Check Redis connectivity; confirm limit keys not shared across environments.
2. **Token spray on estimates:** Rotate estimate public tokens at source; no platform-wide block without founder approval.
3. **Cross-tenant report:** Treat as **P0** — run FS-92 matrix on `dev` head before merge.

## Change control

New public routes require: Zod validation, tenant scoping, rate limit or explicit ADR exception, Sam security review.
