# STACK-14 — Stripe Connect shop fee (Flex vs Flat)

**Founder policy (2026-10-23):** Flex **$299/mo + 5%** of payments processed; Flat **$799/mo**, **no** platform shop fee on Connect. **Test mode only.**

## Configuration (single knob)

| Env | Purpose |
| --- | --- |
| `STRIPE_PLATFORM_FEE_PERCENT` | Decimal fraction for **Flex** Connect application fee (e.g. `0.05` = 5%). Not applied on Flat. |
| `STRIPE_PLATFORM_BILLING_PRICE_ID_FLEX` | Stripe Price id — Flex subscription |
| `STRIPE_PLATFORM_BILLING_PRICE_ID_FLAT` | Stripe Price id — Flat subscription |
| `STRIPE_PLATFORM_BILLING_PRICE_ID` | Legacy alias for Flex price when `_FLEX` unset |

Resolution lives in `@fsm/config/stripe-pricing` (`resolveConnectApplicationFeeFraction`, `resolvePlatformBillingPriceId`).

## Runtime

- Tenant plan stored in `companies.settings.stripePlatformBilling.planTier` (`flex` \| `flat`) from platform billing webhooks / checkout metadata.
- Invoice checkout and maintenance-plan Connect subscriptions pass `connectApplicationFeeFraction` from `resolveCompanyConnectApplicationFeeFraction(company)` — **0** on Flat.
- Connect status API returns effective `platformFeePercent` (0 on Flat) and `renvaniPlanTier`.

**Owners:** Ruby / Felix — STACK delivery; folded into `cursor/stack-stripe-connect-1f27`.
