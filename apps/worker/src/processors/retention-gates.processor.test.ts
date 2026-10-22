import type { Job } from "bullmq";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OPERATOR_QUEUE_JOB_NAMES, defaultRetentionCustomerPrefs } from "@fsm/types";

vi.mock("@fsm/jobs", () => ({
  operatorQueue: {
    add: vi.fn()
  }
}));

vi.mock("@fsm/config/feature-flags", () => ({
  featureFlags: {
    retentionGatesEnqueue: true,
    retentionWinBackEnqueue: false
  }
}));

import {
  processRetentionGatesAfterCompletionConfirm,
  type RetentionGatesDependencies
} from "./retention-gates.processor.js";

function createJob(
  data: Record<string, unknown>
): Job<Record<string, unknown>> {
  return {
    id: "job-1",
    name: OPERATOR_QUEUE_JOB_NAMES.retentionGatesAfterCompletionConfirm,
    data
  } as unknown as Job<Record<string, unknown>>;
}

describe("retention-gates.processor", () => {
  let dependencies: RetentionGatesDependencies;

  beforeEach(() => {
    dependencies = {
      loadEvaluationInput: vi.fn(),
      enqueueProposalCreate: vi.fn()
    };
  });

  it("enqueues proposal create jobs for allowed touchpoints", async () => {
    vi.mocked(dependencies.loadEvaluationInput).mockResolvedValue({
      companyId: "c1",
      jobId: "j1",
      customerId: "cust1",
      jobStatus: "completed",
      prerequisiteProposalId: "p1",
      prerequisiteStatus: "approved",
      jobCompletedActivityEventId: "e1",
      customer: defaultRetentionCustomerPrefs(),
      automationRules: [
        { id: "r1", ruleType: "job_follow_up", isEnabled: true },
        { id: "r2", ruleType: "review_request", isEnabled: true }
      ],
      openServiceIssue: false,
      retentionGatesEnabled: true
    });

    await processRetentionGatesAfterCompletionConfirm(
      createJob({
        companyId: "c1",
        jobId: "j1",
        customerId: "cust1",
        prerequisiteProposalId: "p1",
        jobCompletedActivityEventId: "e1"
      }) as never,
      dependencies
    );

    expect(dependencies.enqueueProposalCreate).toHaveBeenCalled();
    const firstCall = vi.mocked(dependencies.enqueueProposalCreate).mock.calls[0]?.[0];
    expect(firstCall?.dryRun).toBe(true);
    expect(firstCall?.metadata.domain).toBe("retention");
  });

  it("does not enqueue outreach when consent was revoked (FS-13)", async () => {
    vi.mocked(dependencies.loadEvaluationInput).mockResolvedValue({
      companyId: "c1",
      jobId: "j1",
      customerId: "cust1",
      jobStatus: "completed",
      prerequisiteProposalId: "p1",
      prerequisiteStatus: "approved",
      jobCompletedActivityEventId: "e1",
      customer: defaultRetentionCustomerPrefs({
        consentCapturedAt: "2026-10-01T12:00:00.000Z",
        consentRevokedAt: "2026-10-02T00:00:00.000Z"
      }),
      automationRules: [{ id: "r1", ruleType: "job_follow_up", isEnabled: true }],
      openServiceIssue: false,
      retentionGatesEnabled: true
    });

    await processRetentionGatesAfterCompletionConfirm(
      createJob({
        companyId: "c1",
        jobId: "j1",
        customerId: "cust1",
        prerequisiteProposalId: "p1",
        jobCompletedActivityEventId: "e1"
      }) as never,
      dependencies
    );

    expect(dependencies.enqueueProposalCreate).not.toHaveBeenCalled();
  });
});
