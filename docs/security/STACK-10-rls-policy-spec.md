# STACK-10 — PostgreSQL RLS policy specification

**Owner:** Sam · **Pairs with:** STACK-02 (Clerk org → `company_id` session GUC)

## Session context

Every API/worker DB transaction that serves a tenant request must run:

```sql
SELECT set_config('app.current_company_id', '<company_uuid>', true);
```

Implemented in `@fsm/db` as `buildTenantSessionSetLocal()` (see `tenant-session.ts`).

## Policy shape

- `USING (company_id::text = current_setting('app.current_company_id', true))`
- Applies to tenant tables (customers, jobs, import_sessions, …) — catalog in `rls-policy-catalog.ts`.
- **Defense in depth** — service layer `companyId` filters remain mandatory.

## Migration gate

- Land on **Neon staging** only after STACK-01 connection strings exist.
- Migration follows **0026** lineage migration on `dev`.

## Verification

- Sam STACK-03 matrix + dedicated RLS integration tests (post-policy migration).
