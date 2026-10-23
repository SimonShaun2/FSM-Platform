import { env } from "./env.js";

/** Renvani SaaS subscription tier (founder pricing 2026-10-23). */
export type RenvaniSubscriptionPlan = "flex" | "flat";

/**
 * Flex shop fee on Connect-processed customer payments (decimal fraction).
 * Config: STRIPE_PLATFORM_FEE_PERCENT (e.g. 0.05 = 5%). Not hard-coded in call sites.
 */
export function flexConnectApplicationFeeFraction(): number {
  return env.STRIPE_PLATFORM_FEE_PERCENT;
}

/**
 * Connect application fee fraction for a tenant's Renvani plan.
 * Flat ($799/mo): no platform shop fee on processed payments.
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
