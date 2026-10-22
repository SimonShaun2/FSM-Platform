# Runbook — Failed database migration (staging / isolated)

**FS-80 evidence path.** Do not run against production without founder authorization. Full backup restore drill → **FS-83**.

## Prerequisites

- Isolated database instance (staging clone or local Postgres)
- `DATABASE_URL` pointing at the target instance
- Application stopped on that instance (no API/worker/webhook writers)
- Last known good migration tag from `packages/db/migrations/meta/_journal.json`

## Detect failure

1. Migration command exits non-zero: `pnpm --filter @fsm/db db:migrate`
2. Check `drizzle.__drizzle_migrations` (or kit logs) for last applied tag
3. Capture Postgres error (lock timeout, duplicate object, constraint violation)

## Recovery decision tree

### A. Migration never committed (transaction rolled back)

1. Fix forward migration SQL or schema in a new branch (never rewrite applied history on shared envs)
2. Re-run `db:migrate` on isolated instance
3. Smoke-test: `pnpm --filter @fsm/api test` (local) against isolated DB if available

### B. Partial apply / DDL outside transaction (rare)

1. Inspect object state (`\d table`, index presence) vs expected end state
2. Either:
   - **Forward fix:** new migration reconciles drift, or
   - **Restore:** rebuild isolated DB from backup snapshot (FS-83 procedure) and replay migrations from empty

### C. Data backfill failed mid-job

1. Mark worker job failed; do not re-run destructive steps blindly
2. Use idempotent backfill with progress cursor; verify `companyId` scoping on every row touched

## Verification checklist (isolated)

- [ ] `db:migrate` completes with journal head matching PR
- [ ] Schema diff: no unexpected manual objects
- [ ] Representative tenant row counts match pre-migration snapshot (if available)
- [ ] API health: login + single read per critical entity (job, invoice, customer)
- [ ] No cross-tenant rows in spot-check queries (`company_id` filter)

## Escalation

- Architecture / provider limits → FS-93 ADR
- Business continuity targets → FS-83
- Application transaction bugs → FS-68
