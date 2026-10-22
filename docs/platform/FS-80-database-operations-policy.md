# FS-80 — Database operations policy (provider-neutral)

**Ticket:** [FS-80](https://app.notion.com/p/401317b92d1581218acde0a859b47bea)  
**Owner:** Pair 2 (Backend Dev 2 — transactions/migrations slice)  
**Boundaries:** Backup/restore drill → **FS-83**; managed provider ADR → **FS-93**; application deadlock fixes → **FS-68** (board; not in repo head).

## Migration ordering and release sequencing

1. Migrations live in `packages/db/migrations/` and are generated with `pnpm --filter @fsm/db db:generate` after `schema.ts` changes.
2. Never hand-edit generated SQL except through reviewed Drizzle output; journal order is authoritative (`migrations/meta/_journal.json`).
3. Use **expand → migrate → contract** for breaking changes:
   - **Expand:** add nullable columns/tables/indexes; deploy application code that writes new shape but reads old+new.
   - **Migrate:** backfill data in workers or one-off jobs; keep migrations idempotent where possible.
   - **Contract:** remove deprecated columns only after all writers/readers are on the new shape.
4. Run migrations from a **single role** (`FSM_PROCESS_ROLE=migration`) during deploy; do not run `db:migrate` from every API replica concurrently.
5. Long-running DDL must use concurrent index creation where PostgreSQL allows; document lock expectations in the PR.

## Connection budgets

Each Node process (`api`, `worker`, `webhook`) shares one `postgres.js` pool via `@fsm/db`.

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_POOL_MAX` | Max connections per process | `1` in test, `10` otherwise |
| `DATABASE_IDLE_TIMEOUT_SECONDS` | Idle connection reclamation | `20` |
| `DATABASE_CONNECT_TIMEOUT_SECONDS` | TCP connect timeout | `10` |
| `DATABASE_SERVICE_MAX_CONNECTIONS` | Documented DB service ceiling for budgeting | unset |

Use `computeConnectionBudget()` from `@fsm/db` with replica counts from deployment config. Aggregate client connections must stay below `DATABASE_SERVICE_MAX_CONNECTIONS - reservedForAdmin` once FS-93 records the real service limit.

Set `FSM_PROCESS_ROLE` (`api` | `worker` | `webhook` | `migration`) so `application_name` is identifiable in `pg_stat_activity`.

## Transaction boundaries

1. **Multi-table state changes** (entity + `activity_events`, parent + children, financial totals) run inside `db.transaction` and use `emitEventWithExecutor(tx, …)` so events commit with the same atomic unit.
2. **External side effects** (BullMQ enqueue, Stripe, Twilio, SendGrid, R2 upload) happen **after** commit unless the ticket explicitly requires outbox pattern (FS-15).
3. **Retries:** `runTransactionWithRetry()` retries only PostgreSQL deadlock (`40P01`), serialization failure (`40001`), and lock-not-available (`55P03`). Do not wrap callbacks that perform non-idempotent external I/O.
4. **Number sequences** (`generateJobNumber`, invoice/estimate numbers) rely on `SELECT … FOR UPDATE` inside an open transaction; callers must allocate numbers within the same transaction that inserts the row.

## Monitoring expectations (application-owned)

Until FS-93 selects observability tooling, operators should watch:

- Connection count vs budget (`pg_stat_activity` grouped by `application_name`)
- Migration failures (deploy logs + `drizzle.__drizzle_migrations` last row)
- Slow queries and lock waits (database logs / `pg_stat_statements` when enabled)
- Worker/API error rates on `INTERNAL_ERROR` after deploy

## Out of scope for FS-80 (handled elsewhere)

| Topic | Ticket |
|---|---|
| Business RPO/RTO, full continuity drill | FS-83 |
| Provider provisioning, PITR configuration, PgBouncer choice | FS-93 |
| Per-service deadlock refactors | FS-68 |
