# FS-81 — Queue retries, dead-letter retention, and replay (v0.1)

**Ticket:** FS-81  
**Owner:** Pair 1 (Ava — policy/worker wiring; Marcus — replay tooling + tests)  
**Status:** PROPOSED on `cursor/fs-81-queue-retry-dlq-18af`

## Policy (`@fsm/jobs`)

- Default enqueue: **5** attempts, exponential backoff **5s**, `removeOnFail: false` (failed jobs remain visible for DLQ/replay).
- Workers: shared Redis connection, prefix `fsm`, default **concurrency 5** (`buildDefaultWorkerOptions`).

## Replay tooling

- Library: `replayFailedJobById(queue, { queueName, jobId, expectedCompanyId? })` — only **`failed`** jobs; optional tenant guard on `data.companyId`.
- CLI (staging/ops, no live creds in CI): `pnpm --filter @fsm/worker replay-failed-job -- --queue notifications --job-id <id> [--company-id <uuid>]`.

## Acceptance traceability (partial)

| Criterion | v0.1 |
|-----------|------|
| Poison → visible DLQ | `removeOnFail: false` default |
| Safe replay | Tenant-scoped replay helper + tests |
| No duplicate side effects on retry | **Existing processor idempotency** (out of scope to change here) |

## Blocked

- Alerting/metrics for DLQ depth (Platform observability ticket).
- FS-15 outbox alignment for all enqueue sites (follow-up).
