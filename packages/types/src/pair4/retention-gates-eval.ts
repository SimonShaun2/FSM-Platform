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
import {
  RETENTION_ELIGIBLE_JOB_STATUSES,
  type RetentionAutomationRuleSnapshot,
  type RetentionBlockReasonCode,
  type RetentionCustomerChannelPrefs,
  type RetentionGatesEvaluationInput,
  type RetentionGatesEvaluationResult,
  type RetentionTouchpointDecision
} from "./retention-gates.js";

const DEFAULT_POLICY_VERSION = "fs-8-draft";

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

  if (!input.retentionGatesEnabled) {
    return {
      touchpoint,
      allowed: false,
      reasonCode: "FEATURE_DISABLED",
      automationRuleId: automationRule?.id ?? null
    };
  }

  if (!isPrerequisiteSatisfied(input.prerequisiteStatus)) {
    return {
      touchpoint,
      allowed: false,
      reasonCode: "PREREQUISITE_NOT_APPROVED",
      automationRuleId: automationRule?.id ?? null
    };
  }

  if (!RETENTION_ELIGIBLE_JOB_STATUSES.includes(input.jobStatus)) {
    return {
      touchpoint,
      allowed: false,
      reasonCode: "JOB_STATUS_INELIGIBLE",
      automationRuleId: automationRule?.id ?? null
    };
  }

  if (input.openServiceIssue && touchpoint !== "retention_issue_check") {
    return {
      touchpoint,
      allowed: false,
      reasonCode: "OPEN_SERVICE_ISSUE",
      automationRuleId: automationRule?.id ?? null
    };
  }

  if (automationRule && !automationRule.isEnabled) {
    return {
      touchpoint,
      allowed: false,
      reasonCode: "AUTOMATION_DISABLED",
      automationRuleId: automationRule.id
    };
  }

  if (!consentAllowsTouchpoint(touchpoint, input.customer)) {
    return {
      touchpoint,
      allowed: false,
      reasonCode: "CONSENT_REQUIRED",
      automationRuleId: automationRule?.id ?? null
    };
  }

  return {
    touchpoint,
    allowed: true,
    automationRuleId: automationRule?.id ?? null
  };
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
