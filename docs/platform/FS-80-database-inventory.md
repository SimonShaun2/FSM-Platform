# FS-80 — Database inventory (2026-10-22)

Provider-neutral snapshot at branch `cursor/fs-80-database-transactions`. Regenerate migration list with `ls packages/db/migrations/*.sql`.

## Migrations (18 SQL files, idx 0–17)

| Idx | Tag | Notes |
|---:|---|---|
| 0–16 | `0000` … `0016` | Historical FSM schema evolution via Drizzle |
| 17 | `0017_agent_control_plane` | Agent control plane tables |

**Tooling:** `drizzle-kit migrate` (`packages/db/package.json` → `db:migrate`). Config: `packages/db/drizzle.config.ts`.

## Connection use

| Process | Module | Pool |
|---|---|---|
| API | `@fsm/db` → `packages/db/src/client.ts` | `DATABASE_POOL_MAX` (default 10 prod/dev, 1 test) |
| Worker | same shared client | same |
| Webhook | same shared client | same |

No per-route pools; budget = `replicas × DATABASE_POOL_MAX` per role.

## Transaction coverage (services)

Heavy `db.transaction` usage: `job.service`, `invoice.service`, `estimate.service`, `booking.service`, `auth.service`, `import.service`, `customer.service`, Stripe/Twilio webhook handlers, CSV import worker paths.

**Patterns verified in code review:**

- Job completion updates job, customer, technician, asset, and activity event in one transaction (`completeJob`).
- Import rollback and session lifecycle use transactions (`import.service`, CSV worker).

## Gaps / follow-ups (not fixed in FS-80 without FS-68)

| Area | Risk | Suggested owner |
|---|---|---|
| `apps/worker/src/processors/ai-revenue.processor.ts` | Recommendation insert + `emitEvent` may split across transactions | FS-68 |
| `apps/worker/src/processors/agreements.processor.ts` | Same pattern for AI recommendation events | FS-68 |
| `attachment.service` upload | R2 upload precedes DB insert; failed TX leaves orphan objects | Outbox/cleanup ticket |
| `dispatch.service` | Read-heavy caching; no multi-write risk | — |

## FS-68 incorporation

Board ticket **FS-68** tracks application-level transaction corrections. This inventory lists candidate paths; merging FS-68 should reference this doc and close rows explicitly in PR evidence.

## Restore / backup

Encrypted backup configuration, PITR, and isolated restore validation are **FS-83** and **FS-93**. FS-80 only documents migration failure recovery (see runbook).
