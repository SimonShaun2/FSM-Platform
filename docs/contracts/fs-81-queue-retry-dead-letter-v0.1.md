# FS-81 — Queues, retries & dead-letter recovery (v0.1)

**Status:** PROPOSED — provider-neutral BullMQ abstractions only  
**Blocked by:** [FS-93](https://app.notion.com/p/401317b92d1581bf8c25ef10aebae676) for vendor/SaaS queue choice  
**Types:** `packages/types/src/queue-platform/v0/`  
**Runtime:** `packages/jobs/` (`platformDefaultJobOptions`, DLQ forward/recover)

## Objective

Standardize retry/backoff defaults and dead-letter forwarding across FSM workers without adopting a third-party observability or queue vendor.

## Contract

| Piece | Location |
|-------|----------|
| Retry policy | `PlatformQueueRetryPolicyV1` — default 5 attempts, exponential 5s backoff |
| Failure class | `classifyJobFailureV1` — transient / permanent / unknown (heuristic) |
| DLQ naming | `{sourceQueue}-dlq` (BullMQ queue name under prefix `fsm`) |
| Envelope | `DeadLetterJobEnvelopeV1` — source job metadata + payload snapshot |
| Recovery | `recoverDeadLetterJob(sourceQueue, request)` re-enqueues to source queue |

## Wiring

- All platform queues get `defaultJobOptions` from `platformDefaultJobOptions()`.
- `apps/worker` `createWorker` forwards exhausted jobs via `handleWorkerJobFailed`.

## Out of scope

- Cloud vendor DLQ (SQS, etc.), schema migrations, admin UI for replay.
- Changing processor business logic or adding live integration calls.
