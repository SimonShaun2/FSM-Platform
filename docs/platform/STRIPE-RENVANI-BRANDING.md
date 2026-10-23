# Stripe — Renvani customer branding policy

**Owner:** Shaun (live-mode approvals) · **Default implementer:** STACK-14 / #134

Customers should experience **Renvani** (and the shop name), not Stripe marketing surfaces. Stripe remains the payments processor and appears only where required (Connect KYC, card network disclosures, legal terms).

## In code (this repo)

| Area | Behavior |
| --- | --- |
| Connect accounts | `applyConnectAccountBranding` sets business profile, statement descriptor, and branding colors (logo/icon URLs optional via env). |
| Connect settings UI | Embedded Connect components via `POST /api/v1/stripe/connect/account-session` + `@stripe/connect-js` on **Settings → Payments**. Account Link redirect remains fallback when publishable key missing or flag off. |
| Invoice pay | Embedded Checkout on `/pay/:token` when `stripeRenvaniEmbeddedCheckout` is on; customer emails use **Renvani pay URL**, not `checkout.stripe.com`. |
| Card statements | `buildCardStatementDescriptor` → shop name or `RENAVANI` prefix (`STRIPE_RENVANI_STATEMENT_PREFIX`). |
| Receipts / dunning | PaymentIntent metadata `renvaniReceiptChannel: resend`; transactional email via notifications worker (Resend when `resendEmailEnabled`). **Disable Stripe customer emails** in Dashboard (see below). |

## Env (optional until founder approves live assets)

- `STRIPE_RENVANI_STATEMENT_PREFIX` (default `RENAVANI`)
- `STRIPE_BRANDING_LOGO_URL` / `STRIPE_BRANDING_ICON_URL` — hosted assets for Connect + Checkout branding
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — required for embedded Connect / Checkout on web

## Founder / live-mode checklist (not automated)

- [ ] Stripe Dashboard → **Settings → Branding** (logo, colors, icon) for platform account
- [ ] Connect → **Custom domain** for any remaining hosted pages (invoice/payment links)
- [ ] **Customer emails** off in Stripe Billing settings; receipts/invoices/dunning via Resend as Renvani
- [ ] Statement descriptor prefix review for production connected accounts
- [ ] Replace hosted subscription retry URLs with Renvani invoice portal (follow-up ticket)

## Feature flags (`@fsm/config/feature-flags`)

- `stripeRenvaniEmbeddedCheckout` — invoice embedded Checkout (default **true**)
- `stripeRenvaniConnectEmbedded` — Connect Account Session in app (default **true**)
