# FS-55 Growth Check — security notes

## Trigger surface (v1)

Public growth scans are **not** exposed on unauthenticated routes in v1.

- Enqueue: `POST /api/v1/growth-check/scans` requires JWT auth and staff roles (`owner`, `admin`, `dispatcher`).
- **Captcha / anonymous trigger:** not implemented in v1. If a marketing-facing public scan is added later, it must use Turnstile/hCaptcha (or equivalent) on the public endpoint and stricter global rate limits.

## Rate limits

- **Per-tenant:** 5 enqueue attempts per rolling hour (`GROWTH_CHECK_TENANT_ENQUEUE_LIMIT`).
- **Global:** 30 enqueue attempts per rolling hour across all tenants (`GROWTH_CHECK_GLOBAL_ENQUEUE_LIMIT`).
- Backed by Redis sorted sets in production; in-memory fallback in tests and when Redis is unavailable.

## Worker idempotency

- API idempotency: unique `(company_id, idempotency_key)` on `growth_check_scans`.
- BullMQ `jobId`: `growth-check-public-scan:{companyId}:{idempotencyKey}`.
- Processor skips work when scan status is already `completed`.
- Findings upsert by `(scan_id, check_id)` for safe retries.

## SSRF controls

- Target URLs validated at enqueue (`normalizeGrowthCheckTargetUrl`): blocks localhost, link-local, and RFC1918 hosts.
- Worker fetches only paths declared on the rubric, resolved with `assertFetchUrlAllowedForScan` (same origin as target).
- HTTP client uses `redirect: "error"` and a 10s timeout.

## Feature flag

- `growthCheckPublicScan` in `@fsm/config/feature-flags` gates enqueue and worker execution.

## Negative test coverage

- SSRF allowlist unit tests (`ssrf-allowlist.test.ts`).
- Enqueue rate limit tests (`enqueue-rate-limit.test.ts`).
- Processor tests for private-ops `unknown` findings and completed-scan idempotency.
- Service tests for disabled feature flag and idempotent enqueue.
