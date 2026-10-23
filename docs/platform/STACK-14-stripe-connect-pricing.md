# STACK-14 — Stripe Connect platform fee (Flex vs Flat)

**Founder policy (2026-10-23, clarified 7:08 AM CT):**

- **Flex ($299/mo):** Customers pay a **5% platform fee on top of** the invoice/service amount at checkout. Renvani collects it as the Stripe Connect **application fee**. The shop receives the **full invoice amount** (fee is not deducted from the shop).
- **Flat ($799/mo):** **No** customer platform fee on invoice payments.
- **No fee cap.** Single config: `STRIPE_PLATFORM_FEE_PERCENT` (decimal `0.05`).
- **Test mode only.** Customer fee disclosure is configurable via `CUSTOMER_PLATFORM_FEE_DISCLOSURE` (Terms-owned copy; no hard-coded legal text in app).

## Configuration

| Env | Purpose |
| --- | --- |
| `STRIPE_PLATFORM_FEE_PERCENT` | Decimal fraction for **Flex** customer-paid platform fee (e.g. `0.05` = 5%). **0** effective on Flat. |
| `CUSTOMER_PLATFORM_FEE_DISCLOSURE` | Optional copy shown on public pay surfaces; empty omits disclosure block. |
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

## Maintenance / subscription Connect charges (implemented)

1. Subscription items: plan/service recurring price + **Flex** recurring platform-fee price (5% of plan amount, separate Stripe price/line).
2. `invoice.created` webhook sets `application_fee_amount` to the platform-fee line total (shop receives full plan price via transfer; no `application_fee_percent` shop-net model).
3. Flat: service price only; no platform-fee item or application fee.

**Owners:** Ruby / Felix — `cursor/stack-stripe-connect-1f27`.
