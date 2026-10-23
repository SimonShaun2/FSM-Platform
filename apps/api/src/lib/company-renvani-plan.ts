import { resolveConnectApplicationFeeFraction } from "@fsm/config/stripe-pricing";
import type { CompanySettings } from "@fsm/types";

type CompanySettingsCarrier = {
  settings: unknown;
};

export type RenvaniSubscriptionPlan = "flex" | "flat";

export function readRenvaniSubscriptionPlan(
  company: CompanySettingsCarrier
): RenvaniSubscriptionPlan | null {
  if (!company.settings || typeof company.settings !== "object" || Array.isArray(company.settings)) {
    return null;
  }

  const planTier = (company.settings as CompanySettings).stripePlatformBilling?.planTier;
  return planTier === "flex" || planTier === "flat" ? planTier : null;
}

export function resolveCompanyConnectApplicationFeeFraction(company: CompanySettingsCarrier): number {
  return resolveConnectApplicationFeeFraction(readRenvaniSubscriptionPlan(company));
}
