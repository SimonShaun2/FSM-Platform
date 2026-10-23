import { describe, expect, it } from "vitest";

import { setupTestEnv } from "../test-support/env-setup.js";

setupTestEnv();

import {
  readRenvaniSubscriptionPlan,
  resolveCompanyConnectApplicationFeeFraction
} from "./company-renvani-plan.js";

describe("company-renvani-plan", () => {
  it("reads plan tier from company settings", () => {
    expect(
      readRenvaniSubscriptionPlan({
        settings: { stripePlatformBilling: { planTier: "flex" } }
      })
    ).toBe("flex");
    expect(
      readRenvaniSubscriptionPlan({
        settings: { stripePlatformBilling: { planTier: "flat" } }
      })
    ).toBe("flat");
  });

  it("applies shop fee only for flex tenants", () => {
    const flexCompany = { settings: { stripePlatformBilling: { planTier: "flex" as const } } };
    const flatCompany = { settings: { stripePlatformBilling: { planTier: "flat" as const } } };

    expect(resolveCompanyConnectApplicationFeeFraction(flexCompany)).toBeGreaterThan(0);
    expect(resolveCompanyConnectApplicationFeeFraction(flatCompany)).toBe(0);
  });
});
