import type { Job } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@fsm/config/feature-flags", () => ({
  featureFlags: {
    loyaltyRemindersEnabled: true,
    loyaltyRemindersDryRun: true
  }
}));

import { processEvaluateLoyaltyReminderCandidates } from "./loyalty-reminder-candidates.processor.js";

function createJob(data: Record<string, unknown>): Job<Record<string, unknown>> {
  return {
    id: "job-loyalty",
    name: "evaluate-loyalty-reminder-candidates",
    data,
    updateProgress: vi.fn(async () => undefined)
  } as unknown as Job<Record<string, unknown>>;
}

describe("loyalty-reminder-candidates.processor", () => {
  const evaluateCandidates = vi.fn(async () => [
    {
      ruleFamily: "plan_cadence" as const,
      customerId: "cust-1",
      customerName: "Ada",
      maintenancePlanId: "plan-1",
      evidenceJobId: null,
      importSessionId: null,
      planName: "Quarterly",
      nextServiceDate: "2026-10-30",
      lastServiceDate: null,
      daysUntilDue: 7,
      daysSinceLastService: null,
      dryRun: true
    }
  ]);
  const syncDryRunRecommendations = vi.fn(async () => ({
    createdCount: 1,
    skippedExistingCount: 0
  }));

  beforeEach(() => {
    evaluateCandidates.mockClear();
    syncDryRunRecommendations.mockClear();
  });

  it("evaluates candidates and syncs dry-run recommendations", async () => {
    const job = createJob({
      companyId: "company-1",
      importSessionId: "sess-1",
      horizonDays: 21
    });

    await processEvaluateLoyaltyReminderCandidates(job, {
      evaluateCandidates,
      syncDryRunRecommendations
    });

    expect(evaluateCandidates).toHaveBeenCalledWith("company-1", {
      horizonDays: 21,
      importSessionId: "sess-1",
      lapsedDays: undefined,
      dryRun: true
    });
    expect(syncDryRunRecommendations).toHaveBeenCalled();
    expect(job.updateProgress).toHaveBeenCalledWith(100);
  });
});
