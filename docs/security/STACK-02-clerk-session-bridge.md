# STACK-02 — Clerk session bridge + DB tenant context (Noah)

**Status:** Flag-gated (`clerkAuthParallelJwt` in `@fsm/config/feature-flags`)  
**Pairs with:** STACK-10 (`runTransactionWithTenantSession` / `app.current_company_id`)

## Behavior

1. API `authenticate` tries **in-repo JWT** first (unchanged default).
2. When JWT verify fails and `clerkAuthParallelJwt` is **true** with `CLERK_SECRET_KEY` set, API verifies a **Clerk session token** (`@clerk/backend`).
3. Clerk `org_id` maps to `companies.settings.clerk.organizationId`.
4. Staff user resolved by email within the company (fallback: first active user — staging only).
5. Business writes that need RLS should use `runCompanyScopedTransaction(companyId, …)` from `apps/api/src/lib/company-scoped-transaction.ts`.

## Env

| Variable | Required | Notes |
| --- | --- | --- |
| `CLERK_SECRET_KEY` | When flag on | Empty disables Clerk path |

## Cutover

Keep JWT parallel until Clerk org provisioning and user mapping are complete; then flip default auth in a follow-up ADR addendum.
