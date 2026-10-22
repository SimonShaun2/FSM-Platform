import { describe, expect, it, vi } from "vitest";

vi.mock("@fsm/config/feature-flags", () => ({
  featureFlags: {
    loyaltyRemindersEnabled: false,
    loyaltyRemindersDryRun: true
  }
}));

vi.mock("@fsm/db", () => ({
  db: {},
  maintenancePlans: {},
  customers: {}
}));

import { listLoyaltyReminderCandidates } from "./loyalty-reminder-candidates.service.js";

describe("loyalty-reminder-candidates.service", () => {
  it("returns empty when loyalty reminders feature flag is disabled", async () => {
    const result = await listLoyaltyReminderCandidates("company-1", { horizonDays: 14 });
    expect(result).toEqual({ candidates: [], dryRun: true });
  });
});
