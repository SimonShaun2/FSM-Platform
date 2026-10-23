# STACK-13 — Stripe Billing MVP (Aria)

**Scope:** Platform subscription for Renvani tenants (test mode). **Stripe Connect remains separate** (STACK-14 / existing `/api/v1/stripe/connect/*`).

## API

| Method | Path | Role |
| --- | --- | --- |
| GET | `/api/v1/billing/platform/status` | owner, admin |
| POST | `/api/v1/billing/platform/checkout` | owner |

## Flags & env

- `stripePlatformBillingMvp` in `@fsm/config/feature-flags` (default **false**).
- `STRIPE_PLATFORM_BILLING_PRICE_ID` — Stripe Price id for the MVP plan.

## State

Subscription snapshot stored in `companies.settings.stripePlatformBilling` until a dedicated billing table is justified.
