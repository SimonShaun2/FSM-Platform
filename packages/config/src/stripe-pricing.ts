import { env } from "./env.js";

/** Renvani SaaS subscription tier (founder pricing 2026-10-23). */
export type RenvaniSubscriptionPlan = "flex" | "flat";

/**
 * Flex customer-paid platform fee (decimal fraction).
 * Config: STRIPE_PLATFORM_FEE_PERCENT (e.g. 0.05 = 5%). No cap. Not hard-coded in call sites.
 *
 * The fee is added **on top of** the invoice/service amount at checkout; Renvani collects it
 * as the Connect application fee. The shop receives the full invoice amount (not net of fee).
 */
export function flexConnectApplicationFeeFraction(): number {
  return env.STRIPE_PLATFORM_FEE_PERCENT;
}

export interface CustomerPaidPlatformFeeBreakdown {
  invoiceAmount: string;
  platformFeeAmount: string;
  totalDue: string;
  /** Whole-number percent when Flex fee applies (e.g. 5); null on Flat. */
  platformFeePercent: number | null;
}

function roundMoney(value: number): string {
  return (Math.round(value * 100) / 100).toFixed(2);
}

/** Customer-paid platform fee on top of the service/invoice total (Flex only). */
export function computeCustomerPaidPlatformFee(
  invoiceAmount: string,
  fraction: number
): CustomerPaidPlatformFeeBreakdown {
  const service = Number(invoiceAmount);

  if (!Number.isFinite(service) || fraction <= 0) {
    return {
      invoiceAmount,
      platformFeeAmount: "0.00",
      totalDue: invoiceAmount,
      platformFeePercent: null
    };
  }

  const platformFeeAmount = roundMoney(service * fraction);
  const totalDue = roundMoney(service + Number(platformFeeAmount));
  const platformFeePercent = Math.round(fraction * 10000) / 100;

  return {
    invoiceAmount: roundMoney(service),
    platformFeeAmount,
    totalDue,
    platformFeePercent
  };
}

export function formatCustomerPlatformFeeLineItemName(fraction: number): string {
  const percent = Math.round(fraction * 10000) / 100;
  const label = Number.isInteger(percent) ? `${percent}` : `${percent}`;
  return `Renvani platform fee (${label}%)`;
}

/**
 * Connect application fee fraction for a tenant's Renvani plan.
 * Flat ($799/mo): no customer platform fee on processed payments.
 */
export function resolveConnectApplicationFeeFraction(
  plan: RenvaniSubscriptionPlan | null | undefined
): number {
  if (plan === "flex") {
    return flexConnectApplicationFeeFraction();
  }

  return 0;
}

export function resolvePlatformBillingPriceId(plan: RenvaniSubscriptionPlan): string | null {
  const flexPriceId = (env.STRIPE_PLATFORM_BILLING_PRICE_ID_FLEX ?? "").trim()
    || (env.STRIPE_PLATFORM_BILLING_PRICE_ID ?? "").trim();
  const flatPriceId = (env.STRIPE_PLATFORM_BILLING_PRICE_ID_FLAT ?? "").trim();

  if (plan === "flex") {
    return flexPriceId.length > 0 ? flexPriceId : null;
  }

  return flatPriceId.length > 0 ? flatPriceId : null;
}

export function resolveRenvaniPlanFromStripePriceId(priceId: string): RenvaniSubscriptionPlan | null {
  const normalized = priceId.trim();
  if (!normalized) {
    return null;
  }

  const flexPriceId = (env.STRIPE_PLATFORM_BILLING_PRICE_ID_FLEX ?? "").trim()
    || (env.STRIPE_PLATFORM_BILLING_PRICE_ID ?? "").trim();
  const flatPriceId = (env.STRIPE_PLATFORM_BILLING_PRICE_ID_FLAT ?? "").trim();

  if (flexPriceId && normalized === flexPriceId) {
    return "flex";
  }

  if (flatPriceId && normalized === flatPriceId) {
    return "flat";
  }

  return null;
}
