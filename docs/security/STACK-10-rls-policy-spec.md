# STACK-10 — PostgreSQL RLS policy specification

**Owner:** Sam · **Implementation:** Ezra (migration + Neon CI) · **Pairs with:** STACK-02 (Clerk org → `company_id` session GUC)

## Session context

Every API/worker DB transaction that serves a tenant request must run:

```sql
SELECT set_config('app.current_company_id', '<company_uuid>', true);
```

Implemented in `@fsm/db` as `buildTenantSessionSetLocal()` and `runTransactionWithTenantSession()` (see `tenant-session.ts`, `run-with-tenant-session.ts`).

## Policy shape

- `USING (company_id::text = current_setting('app.current_company_id', true))`
- `ENABLE` + `FORCE ROW LEVEL SECURITY` on each tenant table
- v1 catalog tables: `customers`, `import_sessions`, `jobs` — see `rls-policy-catalog.ts`
- **Defense in depth** — service layer `companyId` filters remain mandatory

## Migration

| idx | Tag | Notes |
| --- | --- | --- |
| 27 | `0027_stack10_tenant_rls_policies` | Generated from catalog via `renderStack10RlsMigrationSql()` |

- Follows `0026_fs_migrate_import_lineage` on `dev` (see [MIGRATION_NUMBERING_REGISTRY](../platform/MIGRATION_NUMBERING_REGISTRY.md)).
- **Neon staging gate** — apply on staging / per-PR branches before production; no prod Neon in CI ([NEON-PER-PR-CI.md](../infrastructure/NEON-PER-PR-CI.md)).

## Verification

- **Unit:** `rls-migration-sql.test.ts` (committed SQL matches catalog)
- **Integration (optional):** `rls-policies.integration.test.ts` when `NEON_CI_DATABASE_URL` or non-stub `DATABASE_URL` is set
- **STACK-03 matrix** — same cross-tenant cases with session GUC set on DB pool (STACK-02 follow-up)

## CI

`batch-ci` label → job `neon-per-pr-staging` runs `scripts/ci/neon-per-pr-branch.mjs` with `NEON_CI_STAGING_DATABASE_URL` (staging-only).
