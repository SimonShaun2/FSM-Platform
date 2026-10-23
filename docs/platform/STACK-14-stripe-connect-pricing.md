# STACK-14 — Stripe Connect platform fee (Flex vs Flat)

**Founder policy (2026-10-23, clarified 7:08 AM CT):**

- **Flex ($299/mo):** Customers pay a **5% platform fee on top of** the invoice/service amount at checkout. Renvani collects it as the Stripe Connect **application fee**. The shop receives the **full invoice amount** (fee is not deducted from the shop).
- **Flat ($799/mo):** **No** customer platform fee on invoice payments.
- **No fee cap.** Single config: `STRIPE_PLATFORM_FEE_PERCENT` (decimal `0.05`).
- **Test mode only.** Dual-pricing / surcharge compliance copy is flagged for counsel review — do not block engineering on it.

## Configuration

| Env | Purpose |
| --- | --- |
| `STRIPE_PLATFORM_FEE_PERCENT` | Decimal fraction for **Flex** customer-paid platform fee (e.g. `0.05` = 5%). **0** effective on Flat. |
| `STRIPE_PLATFORM_BILLING_PRICE_ID_FLEX` | Stripe Price id — Flex subscription |
| `STRIPE_PLATFORM_BILLING_PRICE_ID_FLAT` | Stripe Price id — Flat subscription |
| `STRIPE_PLATFORM_BILLING_PRICE_ID` | Legacy alias for Flex price when `_FLEX` unset |

Helpers: `@fsm/config/stripe-pricing` — `computeCustomerPaidPlatformFee`, `resolveConnectApplicationFeeFraction`, `resolvePlatformBillingPriceId`.

## Invoice checkout (implemented)

1. Line items: invoice/service lines (shop receives this total via transfer).
2. **Flex only:** separate Checkout line item — `Renvani platform fee (5%)` — customer-paid, with clear description.
3. `application_fee_amount` = platform fee cents (matches the added line item).
4. Customer total charged = invoice amount + platform fee.

## Customer-facing surfaces

- **Public pay page** (`/pay/[token]`): shows invoice amount, platform fee (Flex), and total due before redirecting to Stripe.
- **Stripe Checkout:** platform fee as its own line item.

## Maintenance / subscription Connect charges

Recurring Connect subscriptions still use `application_fee_percent` today; aligning recurring charges with the same **customer-paid on top** model is a follow-up (may require price adjustment or invoice items). Invoice checkout is the v1 path.

**Owners:** Ruby / Felix — `cursor/stack-stripe-connect-1f27`.
