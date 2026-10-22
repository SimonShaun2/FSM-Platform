import { describe, expect, it } from "vitest";

import { ErrorCode } from "../errors.js";
import { evaluateOutboundAuthorization } from "./evaluate.js";
import { OUTBOUND_AUTHORIZATION_POLICY_V1 } from "./types.js";

const baseConsent = {
  consentScope: "marketing" as const,
  capturedAt: "2026-10-01T12:00:00.000Z",
  consentVersion: 2,
  appointmentOptIn: true,
  marketingOptIn: true,
  revokedAt: null,
  currentConsentVersion: 2
};

const baseCustomer = {
  doNotContact: false,
  prefersSms: true,
  prefersEmail: true
};

describe("evaluateOutboundAuthorization", () => {
  it("allows when all checks pass and records policy version + reason", () => {
    const decision = evaluateOutboundAuthorization({
      policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
      kind: "agent_action_execute",
      resourceCompanyId: "company-a",
      actor: { companyId: "company-a", actorId: "user-1", actorType: "user" },
      channel: "sms",
      actionType: "message.send_proposed",
      consent: baseConsent,
      customer: baseCustomer,
      approval: { required: true, approved: true }
    });

    expect(decision.allowed).toBe(true);
    expect(decision.policyVersion).toBe(OUTBOUND_AUTHORIZATION_POLICY_V1);
    expect(decision.reason).toContain("passed");
  });

  it("denies cross-tenant access", () => {
    const decision = evaluateOutboundAuthorization({
      policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
      kind: "queued_outreach",
      resourceCompanyId: "company-b",
      actor: { companyId: "company-a", actorId: "user-1", actorType: "user" },
      channel: "sms",
      actionType: "customer_message",
      consent: baseConsent,
      customer: baseCustomer
    });

    expect(decision.allowed).toBe(false);
    expect(decision.failureCode).toBe("CROSS_TENANT_ACCESS");
    expect(decision.errorCode).toBe(ErrorCode.NOT_FOUND);
    expect(decision.policyVersion).toBe(OUTBOUND_AUTHORIZATION_POLICY_V1);
    expect(decision.reason.length).toBeGreaterThan(0);
  });

  it("denies forged identity when asserted company disagrees with session tenant", () => {
    const decision = evaluateOutboundAuthorization({
      policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
      kind: "agent_action_execute",
      resourceCompanyId: "company-a",
      actor: {
        companyId: "company-a",
        actorId: "user-1",
        actorType: "user",
        assertedCompanyId: "company-evil"
      },
      channel: "email",
      actionType: "message.send_proposed",
      consent: { ...baseConsent, consentScope: "appointment" },
      customer: baseCustomer,
      approval: { required: true, approved: true }
    });

    expect(decision.failureCode).toBe("FORGED_IDENTITY");
    expect(decision.errorCode).toBe(ErrorCode.FORBIDDEN);
  });

  it("denies stale consent snapshots", () => {
    const decision = evaluateOutboundAuthorization({
      policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
      kind: "queued_outreach",
      resourceCompanyId: "company-a",
      actor: { companyId: "company-a", actorId: "system", actorType: "system" },
      channel: "sms",
      actionType: "customer_message",
      consent: { ...baseConsent, consentVersion: 1, currentConsentVersion: 3 },
      customer: baseCustomer
    });

    expect(decision.failureCode).toBe("STALE_CONSENT");
    expect(decision.errorCode).toBe(ErrorCode.CONSENT_REQUIRED);
  });

  it("denies outreach when consent was revoked after capture", () => {
    const decision = evaluateOutboundAuthorization({
      policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
      kind: "queued_outreach",
      resourceCompanyId: "company-a",
      actor: { companyId: "company-a", actorId: "system", actorType: "system" },
      channel: "sms",
      actionType: "customer_message",
      consent: {
        ...baseConsent,
        capturedAt: "2026-10-01T12:00:00.000Z",
        revokedAt: "2026-10-02T00:00:00.000Z"
      },
      customer: baseCustomer
    });

    expect(decision.failureCode).toBe("CONSENT_REVOKED");
    expect(decision.errorCode).toBe(ErrorCode.CONSENT_REQUIRED);
  });

  it("denies unauthorized sends without approval", () => {
    const decision = evaluateOutboundAuthorization({
      policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
      kind: "agent_action_execute",
      resourceCompanyId: "company-a",
      actor: { companyId: "company-a", actorId: "user-1", actorType: "user" },
      channel: "sms",
      actionType: "message.send_proposed",
      consent: baseConsent,
      customer: baseCustomer,
      approval: { required: true, approved: false }
    });

    expect(decision.failureCode).toBe("UNAUTHORIZED_SEND");
    expect(decision.errorCode).toBe(ErrorCode.POLICY_DENIED);
  });
});
