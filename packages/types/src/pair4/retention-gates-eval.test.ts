import { describe, expect, it } from "vitest";

import { evaluateRetentionGates } from "./retention-gates-eval.js";

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
      customer: {
        prefersSms: true,
        prefersEmail: false,
        doNotContact: false,
        marketingOptIn: true,
        appointmentOptIn: true
      },
      automationRules: [{ id: "r1", ruleType: "job_follow_up", isEnabled: true }],
      openServiceIssue: false,
      retentionGatesEnabled: true
    });

    const thankYou = result.touchpoints.find((row) => row.touchpoint === "retention_thank_you");
    expect(thankYou?.allowed).toBe(true);
  });
});
