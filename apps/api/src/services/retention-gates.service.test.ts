import { describe, expect, it } from "vitest";

import { defaultRetentionCustomerPrefs } from "@fsm/types";

import {
  buildProposalCreateCustomerMessageJob,
  evaluateRetentionGates
} from "./retention-gates.service.js";

const baseInput = {
  companyId: "company-1",
  jobId: "job-1",
  customerId: "customer-1",
  jobStatus: "completed" as const,
  prerequisiteProposalId: "prop-confirm-1",
  prerequisiteStatus: "approved" as const,
  jobCompletedActivityEventId: "evt-job-completed-1",
  customer: defaultRetentionCustomerPrefs(),
  automationRules: [
    { id: "rule-follow", ruleType: "job_follow_up" as const, isEnabled: true },
    { id: "rule-review", ruleType: "review_request" as const, isEnabled: true }
  ],
  openServiceIssue: false,
  retentionGatesEnabled: true
};

describe("evaluateRetentionGates", () => {
  it("blocks all touchpoints when prerequisite is not approved (G-RET-1)", () => {
    const result = evaluateRetentionGates({
      ...baseInput,
      prerequisiteStatus: "other"
    });

    expect(result.touchpoints.every((row) => !row.allowed)).toBe(true);
    expect(result.touchpoints[0]?.reasonCode).toBe("PREREQUISITE_NOT_APPROVED");
  });

  it("blocks outreach when an open service issue exists (except issue check touchpoint)", () => {
    const result = evaluateRetentionGates({
      ...baseInput,
      openServiceIssue: true
    });

    const rebook = result.touchpoints.find((row) => row.touchpoint === "retention_rebook_offer");
    const issueCheck = result.touchpoints.find((row) => row.touchpoint === "retention_issue_check");

    expect(rebook?.allowed).toBe(false);
    expect(rebook?.reasonCode).toBe("OPEN_SERVICE_ISSUE");
    expect(issueCheck?.allowed).toBe(true);
  });

  it("blocks when SMS marketing consent is missing for rebook offer", () => {
    const result = evaluateRetentionGates({
      ...baseInput,
      customer: {
        ...baseInput.customer,
        marketingOptIn: false
      }
    });

    const rebook = result.touchpoints.find((row) => row.touchpoint === "retention_rebook_offer");
    expect(rebook?.allowed).toBe(false);
    expect(rebook?.reasonCode).toBe("CONSENT_REQUIRED");
  });

  it("includes win-back touchpoint when flag input requests it", () => {
    const result = evaluateRetentionGates({
      ...baseInput,
      includeWinBackTouchpoint: true,
      automationRules: [
        ...baseInput.automationRules,
        { id: "rule-dormant", ruleType: "dormant_customer", isEnabled: true }
      ]
    });

    expect(result.touchpoints.some((row) => row.touchpoint === "retention_win_back_offer")).toBe(
      true
    );
  });
});

describe("buildProposalCreateCustomerMessageJob", () => {
  it("builds stable idempotency key and attribution metadata", () => {
    const job = buildProposalCreateCustomerMessageJob({
      companyId: "company-1",
      jobId: "job-1",
      customerId: "customer-1",
      touchpoint: "retention_rebook_offer",
      prerequisiteProposalId: "prop-confirm-1",
      jobCompletedActivityEventId: "evt-1",
      automationRuleId: "rule-follow",
      dryRun: true
    });

    expect(job.dryRun).toBe(true);
    expect(job.metadata.domain).toBe("retention");
    expect(job.metadata.touchpoint).toBe("retention_rebook_offer");
    expect(job.metadata.prerequisiteProposalId).toBe("prop-confirm-1");
    expect(job.metadata.attributionKey).toBe("retention:company-1:job-1:retention_rebook_offer");
    expect(job.idempotencyKey).toContain("proposal:create:company-1:customer_message:job-1:");
  });
});
