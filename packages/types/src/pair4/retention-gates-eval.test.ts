import { describe, expect, it } from "vitest";

import { evaluateRetentionGates } from "./retention-gates-eval.js";
import { defaultRetentionCustomerPrefs } from "./retention-gates.js";

describe("retention-gates-eval", () => {
  it("allows thank-you when gates and prerequisite pass", () => {
    const result = evaluateRetentionGates({
      companyId: "c1",
      jobId: "j1",
      customerId: "cust1",
      jobStatus: "completed",
      prerequisiteProposalId: "p1",
      prerequisiteStatus: "approved",
      jobCompletedActivityEventId: "e1",
      customer: defaultRetentionCustomerPrefs(),
      automationRules: [{ id: "r1", ruleType: "job_follow_up", isEnabled: true }],
      openServiceIssue: false,
      retentionGatesEnabled: true
    });

    const thankYou = result.touchpoints.find((row) => row.touchpoint === "retention_thank_you");
    expect(thankYou?.allowed).toBe(true);
    expect(thankYou?.policyVersion).toBeTruthy();
    expect(thankYou?.reason.length).toBeGreaterThan(0);
  });

  it("blocks queued outreach when consent was revoked (FS-13)", () => {
    const result = evaluateRetentionGates({
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

    expect(result.touchpoints.every((row) => !row.allowed)).toBe(true);
    expect(result.touchpoints[0]?.reasonCode).toBe("CONSENT_REQUIRED");
    expect(result.touchpoints[0]?.reason).toContain("revoked");
  });
});
