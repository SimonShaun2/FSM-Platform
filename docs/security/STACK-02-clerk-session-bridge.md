# STACK-02 — Clerk session bridge + DB tenant context

**Status:** Flag-gated (`clerkAuthParallelJwt`, `tenantSessionScopedWrites` in `@fsm/config/feature-flags`)  
**Owners:** Noah (auth bridge), Kai (tenant write hardening)  
**Pairs with:** STACK-10 (`runTransactionWithTenantSession` / `app.current_company_id`)

## Behavior

1. API `authenticate` tries **in-repo JWT** first (unchanged default).
2. When JWT verify fails and `clerkAuthParallelJwt` is **true** with `CLERK_SECRET_KEY` set, API verifies a **Clerk session token** (`@clerk/backend`). Tests mock `@clerk/backend`; do not use live Clerk keys in CI.
3. Clerk `org_id` (or nested `o.id`) maps to `companies.settings.clerk.organizationId` (`CompanySettings.clerk` in `@fsm/types`).
4. Staff user resolved by email within the company (fallback: first active user — staging only).
5. **Tenant session on writes (flag-gated):** when `tenantSessionScopedWrites` is **true**, critical service writes run through `runTenantAwareTransaction`, which sets `SET LOCAL app.current_company_id` via `runCompanyScopedTransaction` / `runTransactionWithTenantSession`. When **false** (default), behavior matches legacy `runTransactionWithRetry` / `db.transaction`.

## API surfaces

| Surface | Path | Purpose |
| --- | --- | --- |
| Auth plugin | `apps/api/src/plugins/authenticate.ts` | JWT then Clerk parallel path |
| Clerk verify | `apps/api/src/lib/clerk-auth.ts` | Token verify + org claim extraction |
| Org → company | `apps/api/src/services/clerk-tenant.service.ts` | `settings.clerk.organizationId` lookup |
| Scoped writes | `apps/api/src/lib/company-scoped-transaction.ts` | `runTenantAwareTransaction` / `runCompanyScopedTransaction` |
| Request hook | `apps/api/src/plugins/company-scoped-write.ts` | `request.runCompanyScopedTransaction(callback)` after authenticate |

### Critical write paths (tenant-aware)

These use `runTenantAwareTransaction(companyId, …)` today:

- `createCustomer` — `customer.service.ts`
- `createJob` — `job.service.ts`
- `updateCompany` — `company.service.ts` (includes Clerk org mapping in `settings`)

Route handlers should prefer `await request.runCompanyScopedTransaction(async (tx) => { … })` for new multi-table writes when authenticated.

## Env

| Variable | Required | Notes |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | When `clerkAuthParallelJwt` on | Empty disables Clerk verify path |

## Feature flags

| Flag | Default | Effect |
| --- | --- | --- |
| `clerkAuthParallelJwt` | `false` | Accept Clerk session JWT after in-repo JWT fails |
| `tenantSessionScopedWrites` | `false` | Use tenant GUC on `runTenantAwareTransaction` / request scoped helper |

## Tests (no live Clerk)

```bash
pnpm exec vitest run \
  apps/api/src/lib/clerk-auth.test.ts \
  apps/api/src/lib/clerk-company-settings.test.ts \
  apps/api/src/lib/company-scoped-transaction.test.ts \
  apps/api/src/services/clerk-tenant.service.test.ts \
  apps/api/src/plugins/authenticate.test.ts
```

`verifyToken` and Clerk availability are mocked; org mapping tests use in-memory fake DB + `settings.clerk.organizationId`.

## Cutover

1. Enable `clerkAuthParallelJwt` in staging with Clerk dev instance and company `settings.clerk.organizationId` populated.
2. Enable `tenantSessionScopedWrites` when STACK-10 RLS policies are on Neon staging.
3. Keep JWT parallel until Clerk org provisioning and user mapping are complete; then flip default auth in a follow-up ADR addendum.
