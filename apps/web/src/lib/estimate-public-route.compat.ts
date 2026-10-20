/**
 * FS-36 — public vs private estimate URL contract (web).
 *
 * Canonical public customer approval path: `/approve/:approvalToken`
 * Authenticated staff estimate detail: `/estimates/:estimateId` (UUID)
 *
 * Compatibility (Product D1–D5, Security-reviewed):
 * - New outbound links use `/approve/:token` only (`buildEstimatePublicPath`, worker `approvalUrl`).
 * - Legacy GET `/estimates/:approvalToken` is recovered in middleware only when:
 *   1. Segment is not an RFC4122 UUID and not a reserved path (`new`).
 *   2. Segment matches approval token shape (base64url, 32–100 chars).
 *   3. `GET /api/v1/public/estimates/:token` returns 2xx → **307** to `/approve/:token`.
 *   4. Shaped but invalid/expired token → internal rewrite to `/approve/:token` (same UX as public page).
 *   5. Malformed segment → HTTP 404 (no API call).
 * - Blind segment-only redirects are rejected (D2). Staff `/estimates/:uuid` keeps normal JWT gating.
 *
 * Risks for Tech Lead / Security review:
 * - Middleware performs a server-side fetch to the public API (latency, rate limits, SSRF surface bounded to configured API host).
 * - Fetch failures fail closed for 307 but still rewrite shaped tokens to `/approve` for consistent customer messaging.
 */
export const ESTIMATE_PUBLIC_APPROVAL_PATH_PREFIX = "/approve";
