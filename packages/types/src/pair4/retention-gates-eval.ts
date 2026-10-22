import type { JobStatus } from "../job.types.js";
import type { ProposalCreateCustomerMessageJobData } from "./operator-queue-jobs.js";
import {
  CUSTOMER_MESSAGE_METADATA_VERSION,
  RETENTION_POST_SERVICE_TOUCHPOINTS,
  type CustomerMessageProposalMetadata,
  type CustomerMessageTouchpoint,
  buildProposalCreateIdempotencyKey,
  buildRetentionAttributionKey,
  defaultConsentScopeForTouchpoint
} from "./proposal-factory-v0_1_2.js";
import { evaluateOutboundAuthorization } from "../outbound-policy/evaluate.js";
import { OUTBOUND_AUTHORIZATION_POLICY_V1 } from "../outbound-policy/types.js";
import {
  RETENTION_ELIGIBLE_JOB_STATUSES,
  type RetentionAutomationRuleSnapshot,
  type RetentionBlockReasonCode,
  type RetentionCustomerChannelPrefs,
  type RetentionGatesEvaluationInput,
  type RetentionGatesEvaluationResult,
  type RetentionTouchpointDecision
} from "./retention-gates.js";

const DEFAULT_POLICY_VERSION = OUTBOUND_AUTHORIZATION_POLICY_V1;

const BLOCK_REASON_MESSAGES: Record<RetentionBlockReasonCode, string> = {
  FEATURE_DISABLED: "Retention gates feature is disabled for this company",
  PREREQUISITE_NOT_APPROVED: "Job completion confirmation prerequisite is not approved",
  JOB_STATUS_INELIGIBLE: "Job status is not eligible for retention outreach",
  DO_NOT_CONTACT: "Customer is marked do not contact",
  CONSENT_REQUIRED: "Required channel or scope consent is missing",
  AUTOMATION_DISABLED: "Automation rule for this touchpoint is disabled",
  OPEN_SERVICE_ISSUE: "Open service issue suppresses this touchpoint",
  POLICY_DENIED: "Retention policy denied this touchpoint"
};

function blocked(
  touchpoint: CustomerMessageTouchpoint,
  reasonCode: RetentionBlockReasonCode,
  automationRuleId: string | null,
  reason?: string
): RetentionTouchpointDecision {
  return {
    touchpoint,
    allowed: false,
    reasonCode,
    automationRuleId,
    policyVersion: DEFAULT_POLICY_VERSION,
    reason: reason ?? BLOCK_REASON_MESSAGES[reasonCode]
  };
}

function allowed(
  touchpoint: CustomerMessageTouchpoint,
  automationRuleId: string | null,
  reason: string
): RetentionTouchpointDecision {
  return {
    touchpoint,
    allowed: true,
    automationRuleId,
    policyVersion: DEFAULT_POLICY_VERSION,
    reason
  };
}

function isPrerequisiteSatisfied(
  status: RetentionGatesEvaluationInput["prerequisiteStatus"]
): boolean {
  return status === "approved" || status === "executing" || status === "succeeded";
}

function findRule(
  rules: RetentionAutomationRuleSnapshot[],
  ruleType: RetentionAutomationRuleSnapshot["ruleType"]
): RetentionAutomationRuleSnapshot | null {
  return rules.find((rule) => rule.ruleType === ruleType) ?? null;
}

function consentAllowsTouchpoint(
  touchpoint: CustomerMessageTouchpoint,
  customer: RetentionCustomerChannelPrefs
): boolean {
  const scope = defaultConsentScopeForTouchpoint(touchpoint);
  if (customer.doNotContact) {
    return false;
  }
  if (scope === "appointment") {
    return customer.appointmentOptIn && (customer.prefersSms || customer.prefersEmail);
  }
  return customer.marketingOptIn && (customer.prefersSms || customer.prefersEmail);
}

function automationRuleForTouchpoint(
  touchpoint: CustomerMessageTouchpoint,
  rules: RetentionAutomationRuleSnapshot[]
): RetentionAutomationRuleSnapshot | null {
  switch (touchpoint) {
    case "retention_thank_you":
    case "retention_issue_check":
    case "retention_rebook_offer":
      return findRule(rules, "job_follow_up");
    case "retention_review_request":
      return findRule(rules, "review_request");
    case "retention_win_back_offer":
      return findRule(rules, "dormant_customer");
    default: {
      const exhaustive: never = touchpoint;
      return exhaustive;
    }
  }
}

function evaluateTouchpoint(
  touchpoint: CustomerMessageTouchpoint,
  input: RetentionGatesEvaluationInput
): RetentionTouchpointDecision {
  const automationRule = automationRuleForTouchpoint(touchpoint, input.automationRules);
  const automationRuleId = automationRule?.id ?? null;

  if (!input.retentionGatesEnabled) {
    return blocked(touchpoint, "FEATURE_DISABLED", automationRuleId);
  }

  if (!isPrerequisiteSatisfied(input.prerequisiteStatus)) {
    return blocked(touchpoint, "PREREQUISITE_NOT_APPROVED", automationRuleId);
  }

  if (!RETENTION_ELIGIBLE_JOB_STATUSES.includes(input.jobStatus)) {
    return blocked(touchpoint, "JOB_STATUS_INELIGIBLE", automationRuleId);
  }

  if (input.openServiceIssue && touchpoint !== "retention_issue_check") {
    return blocked(touchpoint, "OPEN_SERVICE_ISSUE", automationRuleId);
  }

  if (automationRule && !automationRule.isEnabled) {
    return blocked(touchpoint, "AUTOMATION_DISABLED", automationRule.id);
  }

  const consentScope = defaultConsentScopeForTouchpoint(touchpoint);
  const channel = input.customer.prefersSms ? "sms" : "email";
  const outboundDecision = evaluateOutboundAuthorization({
    policyVersion: DEFAULT_POLICY_VERSION,
    kind: "queued_outreach",
    resourceCompanyId: input.companyId,
    actor: {
      companyId: input.companyId,
      actorId: "retention-gates",
      actorType: "system"
    },
    channel,
    actionType: "customer_message",
    consent: {
      consentScope,
      capturedAt: input.customer.consentCapturedAt,
      consentVersion: input.customer.consentVersion,
      appointmentOptIn: input.customer.appointmentOptIn,
      marketingOptIn: input.customer.marketingOptIn,
      revokedAt: input.customer.consentRevokedAt,
      currentConsentVersion: input.customer.currentConsentVersion
    },
    customer: {
      doNotContact: input.customer.doNotContact,
      prefersSms: input.customer.prefersSms,
      prefersEmail: input.customer.prefersEmail
    }
  });

  if (!outboundDecision.allowed) {
    const reasonCode: RetentionBlockReasonCode =
      outboundDecision.failureCode === "POLICY_DENIED" ? "POLICY_DENIED" : "CONSENT_REQUIRED";
    return blocked(touchpoint, reasonCode, automationRuleId, outboundDecision.reason);
  }

  if (!consentAllowsTouchpoint(touchpoint, input.customer)) {
    return blocked(touchpoint, "CONSENT_REQUIRED", automationRuleId);
  }

  return allowed(touchpoint, automationRuleId, outboundDecision.reason);
}

export function evaluateRetentionGates(
  input: RetentionGatesEvaluationInput
): RetentionGatesEvaluationResult {
  const touchpointList: CustomerMessageTouchpoint[] = [...RETENTION_POST_SERVICE_TOUCHPOINTS];
  if (input.includeWinBackTouchpoint) {
    touchpointList.push("retention_win_back_offer");
  }

  return {
    touchpoints: touchpointList.map((touchpoint) => evaluateTouchpoint(touchpoint, input))
  };
}

export function buildCustomerMessageMetadata(params: {
  companyId: string;
  jobId: string;
  customerId: string;
  touchpoint: CustomerMessageTouchpoint;
  prerequisiteProposalId: string;
  automationRuleId: string | null;
  maintenanceVisitId?: string | null;
  maintenancePlanId?: string | null;
  policyVersion?: string;
}): CustomerMessageProposalMetadata {
  return {
    contractVersion: CUSTOMER_MESSAGE_METADATA_VERSION,
    domain: "retention",
    touchpoint: params.touchpoint,
    consentScope: defaultConsentScopeForTouchpoint(params.touchpoint),
    entityLinks: {
      jobId: params.jobId,
      customerId: params.customerId,
      maintenanceVisitId: params.maintenanceVisitId ?? null,
      maintenancePlanId: params.maintenancePlanId ?? null
    },
    prerequisiteProposalId: params.prerequisiteProposalId,
    automationRuleId: params.automationRuleId,
    attributionKey: buildRetentionAttributionKey(params.companyId, params.jobId, params.touchpoint),
    policyVersion: params.policyVersion ?? DEFAULT_POLICY_VERSION
  };
}

export function buildProposalCreateCustomerMessageJob(params: {
  companyId: string;
  jobId: string;
  customerId: string;
  touchpoint: CustomerMessageTouchpoint;
  prerequisiteProposalId: string;
  jobCompletedActivityEventId: string;
  automationRuleId: string | null;
  maintenanceVisitId?: string | null;
  maintenancePlanId?: string | null;
  dryRun: boolean;
}): ProposalCreateCustomerMessageJobData {
  const metadata = buildCustomerMessageMetadata({
    companyId: params.companyId,
    jobId: params.jobId,
    customerId: params.customerId,
    touchpoint: params.touchpoint,
    prerequisiteProposalId: params.prerequisiteProposalId,
    automationRuleId: params.automationRuleId,
    maintenanceVisitId: params.maintenanceVisitId ?? null,
    maintenancePlanId: params.maintenancePlanId ?? null
  });

  return {
    companyId: params.companyId,
    idempotencyKey: buildProposalCreateIdempotencyKey({
      companyId: params.companyId,
      kind: "customer_message",
      entityId: params.jobId,
      triggerEventId: `${params.jobCompletedActivityEventId}:${params.touchpoint}`
    }),
    metadata,
    sourceEventIds: [params.jobCompletedActivityEventId],
    dryRun: params.dryRun
  };
}

export function summarizeBlockedReasons(
  decisions: RetentionTouchpointDecision[]
): RetentionBlockReasonCode[] {
  const reasons = new Set<RetentionBlockReasonCode>();
  for (const decision of decisions) {
    if (!decision.allowed && decision.reasonCode) {
      reasons.add(decision.reasonCode);
    }
  }
  return [...reasons];
}

export function isRetentionEligibleJobStatus(status: JobStatus): boolean {
  return RETENTION_ELIGIBLE_JOB_STATUSES.includes(status);
}
