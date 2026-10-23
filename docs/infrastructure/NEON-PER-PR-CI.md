# Neon per-PR branch CI (STACK-10 + STACK-11)

**Owner:** Ezra (Infra 2) · **Pairs with:** STACK-02 (Clerk session → `app.current_company_id`)

## Policy

1. **Staging-only** — CI uses Neon **staging project** per-PR branches. **No production** Neon URLs, branches, or data.
2. **PR-head** — `batch-ci` matrix job runs at the **pull request head SHA** (same as primary batch job).
3. **Optional until wired** — Without `NEON_CI_STAGING_DATABASE_URL`, the job **skips** migration/DB tests gracefully; unit tests still enforce wiring contracts.

## GitHub Actions

Workflow: `.github/workflows/batch-ci.yml`  
Job: `neon-per-pr-staging` (requires label `batch-ci`, runs after `batch`).

| Secret | Purpose |
| --- | --- |
| `NEON_CI_STAGING_DATABASE_URL` | Pooled connection string for the PR’s Neon branch (staging project) |

Founder provisions one Neon branch per open migration/security PR (or reuses ephemeral branch naming `pr-<number>`). Agents **must not** create Neon projects or copy prod data.

## Local / agent validation

```bash
pnpm --filter @fsm/config build
pnpm --filter @fsm/db build
RENVANI_DEPLOYMENT_TIER=staging \
  NEON_CI_DATABASE_URL='postgresql://…@ep-staging-pr-NN….neon.tech/neondb' \
  node scripts/ci/neon-per-pr-branch.mjs
```

Guard implementation: `@fsm/config/neon-ci` (`validateNeonCiDatabaseUrl`).

## What runs on Neon

1. `pnpm --filter @fsm/db db:check-migrations` — journal + destructive SQL safety.
2. `pnpm --filter @fsm/db test` — includes `rls-migration-sql` sync test and optional `rls-policies.integration.test.ts` when `NEON_CI_DATABASE_URL` is set.

## RLS migration

- Catalog: `packages/db/src/rls-policy-catalog.ts`
- Generator: `packages/db/src/rls-migration-sql.ts`
- Applied SQL: `packages/db/migrations/0027_stack10_tenant_rls_policies.sql` (after `0026_fs_migrate_import_lineage`)

Apply to Neon staging branches only until STACK-02 session hook is live in API/worker pools.
