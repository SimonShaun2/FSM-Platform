import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnvCacheForTests } from "./env.js";
import { setupTestEnv } from "./test-support/env-setup.js";

describe("stripe-pricing", () => {
  beforeEach(() => {
    setupTestEnv();
    resetEnvCacheForTests();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    resetEnvCacheForTests();
  });

  it("computes customer-paid platform fee on top of invoice total", async () => {
    const { computeCustomerPaidPlatformFee } = await import("./stripe-pricing.js");

    const breakdown = computeCustomerPaidPlatformFee("100.00", 0.05);
    expect(breakdown).toEqual({
      invoiceAmount: "100.00",
      platformFeeAmount: "5.00",
      totalDue: "105.00",
      platformFeePercent: 5
    });

    const flat = computeCustomerPaidPlatformFee("250.50", 0);
    expect(flat.platformFeeAmount).toBe("0.00");
    expect(flat.totalDue).toBe("250.50");
    expect(flat.platformFeePercent).toBeNull();
  });

  it("applies configured flex shop fee fraction", async () => {
    vi.stubEnv("STRIPE_PLATFORM_FEE_PERCENT", "0.05");
    resetEnvCacheForTests();
    const { flexConnectApplicationFeeFraction, resolveConnectApplicationFeeFraction } = await import(
      "./stripe-pricing.js"
    );

    expect(flexConnectApplicationFeeFraction()).toBe(0.05);
    expect(resolveConnectApplicationFeeFraction("flex")).toBe(0.05);
    expect(resolveConnectApplicationFeeFraction("flat")).toBe(0);
    expect(resolveConnectApplicationFeeFraction(null)).toBe(0);
  });

  it("maps Stripe price ids to flex and flat plans", async () => {
    vi.stubEnv("STRIPE_PLATFORM_BILLING_PRICE_ID_FLEX", "price_flex_test");
    vi.stubEnv("STRIPE_PLATFORM_BILLING_PRICE_ID_FLAT", "price_flat_test");
    vi.stubEnv("STRIPE_PLATFORM_BILLING_PRICE_ID", "");
    resetEnvCacheForTests();

    const { resolvePlatformBillingPriceId, resolveRenvaniPlanFromStripePriceId } = await import(
      "./stripe-pricing.js"
    );

    expect(resolvePlatformBillingPriceId("flex")).toBe("price_flex_test");
    expect(resolvePlatformBillingPriceId("flat")).toBe("price_flat_test");
    expect(resolveRenvaniPlanFromStripePriceId("price_flex_test")).toBe("flex");
    expect(resolveRenvaniPlanFromStripePriceId("price_flat_test")).toBe("flat");
  });
});
