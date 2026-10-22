# FS-80 — Backend Dev 2 handoff

**Agent:** Backend Dev 2 (Pair 2)  
**Branch:** `cursor/fs-80-database-transactions`  
**Base:** `dev`

## Verified inputs

- `AGENTS.md`, `TEAM.md`, `GITHUB_WORKFLOW.md` read at task start
- Notion FS-80 acceptance and dependencies; FS-83 / FS-93 boundaries respected

## Delivered in this branch

| Item | Location |
|---|---|
| Configurable pool + timeouts | `packages/config/src/env.ts`, `packages/db/src/connection-config.ts`, `client.ts` |
| Connection budget helper | `computeConnectionBudget` in `@fsm/db` |
| Transaction retry helper (deadlock/serialization only) | `packages/db/src/transactions.ts` → `runWithPostgresRetry` in `postgres-retry.ts` |
| Retryable error classification | `packages/db/src/postgres-errors.ts` |
| Migration safety checks (journal/SQL/destructive guard) | `packages/db/src/migration-safety.ts`, `pnpm --filter @fsm/db db:check-migrations` |
| Unit tests | `packages/db/src/*.test.ts` |
| Migration/transaction policy | `docs/platform/FS-80-database-operations-policy.md` |
| Inventory | `docs/platform/FS-80-database-inventory.md` |
| Migration failure runbook (isolated) | `docs/runbooks/database-migration-failure-recovery.md` |
| `.env.example` database pool vars | `.env.example` |

## Not done (explicit dependencies)

| Acceptance item | Blocker |
|---|---|
| Staging failed-migration test execution | Staging env + Platform |
| Backup restore into isolated env | FS-83 |
| Provider PITR / encrypted backup config | FS-93 ADR |
| FS-68 service-level transaction fixes | FS-68 ticket |
| Concurrency load test on live Postgres | Staging + QA |

## Reviewer focus

- Env defaults: pool `10` non-test vs previous hard-coded `1` — confirm FS-93 connection ceiling before production deploy
- `runTransactionWithRetry` is opt-in; no mass refactor of services in this slice
- Tenant scoping unchanged; no schema migration in this PR

## Suggested local checks

```bash
pnpm install
pnpm --filter @fsm/config build
pnpm --filter @fsm/db lint
pnpm --filter @fsm/db test
```
