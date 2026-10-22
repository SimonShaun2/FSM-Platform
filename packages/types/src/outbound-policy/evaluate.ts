import { ErrorCode } from "../errors.js";
import type {
  OutboundAuthorizationDecision,
  OutboundAuthorizationFailureCode,
  OutboundAuthorizationInput
} from "./types.js";
import { OUTBOUND_AUTHORIZATION_POLICY_V1 } from "./types.js";

function deny(
  policyVersion: string,
  failureCode: OutboundAuthorizationFailureCode,
  reason: string,
  errorCode: ErrorCode
): OutboundAuthorizationDecision {
  return {
    allowed: false,
    policyVersion,
    reason,
    failureCode,
    errorCode
  };
}

function allow(policyVersion: string, reason: string): OutboundAuthorizationDecision {
  return {
    allowed: true,
    policyVersion,
    reason
  };
}

function parseInstant(value: string): number {
  return new Date(value).getTime();
}

function consentScopeSatisfied(input: OutboundAuthorizationInput): boolean {
  const { consent, customer, channel } = input;
  if (customer.doNotContact) {
    return false;
  }
  if (channel === "sms" && !customer.prefersSms) {
    return false;
  }
  if (channel === "email" && !customer.prefersEmail) {
    return false;
  }
  if (consent.consentScope === "appointment") {
    return consent.appointmentOptIn;
  }
  return consent.marketingOptIn;
}

/**
 * Standalone consent + policy + authorization evaluation for outbound/agent sends.
 * Every path returns policyVersion + human-readable reason (FS-13).
 */
export function evaluateOutboundAuthorization(
  input: OutboundAuthorizationInput
): OutboundAuthorizationDecision {
  const policyVersion = input.policyVersion || OUTBOUND_AUTHORIZATION_POLICY_V1;

  if (input.resourceCompanyId !== input.actor.companyId) {
    return deny(
      policyVersion,
      "CROSS_TENANT_ACCESS",
      "Resource company does not match authenticated tenant",
      ErrorCode.NOT_FOUND
    );
  }

  if (
    input.actor.assertedCompanyId !== undefined &&
    input.actor.assertedCompanyId !== input.actor.companyId
  ) {
    return deny(
      policyVersion,
      "FORGED_IDENTITY",
      "Actor asserted a company identity that does not match the session tenant",
      ErrorCode.FORBIDDEN
    );
  }

  if (input.approval?.required && !input.approval.approved) {
    return deny(
      policyVersion,
      "UNAUTHORIZED_SEND",
      "Outbound send requires human approval before execution",
      ErrorCode.POLICY_DENIED
    );
  }

  if (input.kind === "agent_action_execute" && input.actor.actorType === "ai") {
    return deny(
      policyVersion,
      "POLICY_DENIED",
      "AI actors cannot execute outbound sends directly",
      ErrorCode.POLICY_DENIED
    );
  }

  const revokedAtMs = input.consent.revokedAt ? parseInstant(input.consent.revokedAt) : null;
  const capturedAtMs = parseInstant(input.consent.capturedAt);

  if (revokedAtMs !== null && capturedAtMs <= revokedAtMs) {
    return deny(
      policyVersion,
      "CONSENT_REVOKED",
      "Customer consent was revoked before this outreach snapshot was captured",
      ErrorCode.CONSENT_REQUIRED
    );
  }

  if (input.consent.consentVersion < input.consent.currentConsentVersion) {
    return deny(
      policyVersion,
      "STALE_CONSENT",
      "Consent snapshot version is older than the current customer consent record",
      ErrorCode.CONSENT_REQUIRED
    );
  }

  if (!consentScopeSatisfied(input)) {
    return deny(
      policyVersion,
      "CONSENT_REQUIRED",
      `Channel or ${input.consent.consentScope} consent is not satisfied for this send`,
      ErrorCode.CONSENT_REQUIRED
    );
  }

  return allow(policyVersion, "Outbound authorization checks passed");
}
