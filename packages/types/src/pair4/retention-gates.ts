import type { JobStatus } from "../job.types.js";
import type { CustomerMessageTouchpoint } from "./proposal-factory-v0_1_2.js";

export type RetentionBlockReasonCode =
  | "FEATURE_DISABLED"
  | "PREREQUISITE_NOT_APPROVED"
  | "JOB_STATUS_INELIGIBLE"
  | "DO_NOT_CONTACT"
  | "CONSENT_REQUIRED"
  | "AUTOMATION_DISABLED"
  | "OPEN_SERVICE_ISSUE"
  | "POLICY_DENIED";

export function defaultRetentionCustomerPrefs(
  overrides: Partial<RetentionCustomerChannelPrefs> = {}
): RetentionCustomerChannelPrefs {
  return {
    prefersSms: true,
    prefersEmail: false,
    doNotContact: false,
    marketingOptIn: true,
    appointmentOptIn: true,
    consentVersion: 1,
    currentConsentVersion: 1,
    consentCapturedAt: "2026-10-01T12:00:00.000Z",
    consentRevokedAt: null,
    ...overrides
  };
}

export interface RetentionCustomerChannelPrefs {
  prefersSms: boolean;
  prefersEmail: boolean;
  doNotContact: boolean;
  marketingOptIn: boolean;
  appointmentOptIn: boolean;
  /** FS-13 — consent record version at outreach enqueue time. */
  consentVersion: number;
  currentConsentVersion: number;
  consentCapturedAt: string;
  consentRevokedAt: string | null;
}

export interface RetentionAutomationRuleSnapshot {
  id: string;
  ruleType: "job_follow_up" | "review_request" | "dormant_customer";
  isEnabled: boolean;
}

export interface RetentionGatesEvaluationInput {
  companyId: string;
  jobId: string;
  customerId: string;
  jobStatus: JobStatus;
  prerequisiteProposalId: string;
  prerequisiteStatus: "approved" | "executing" | "succeeded" | "other";
  jobCompletedActivityEventId: string;
  customer: RetentionCustomerChannelPrefs;
  automationRules: RetentionAutomationRuleSnapshot[];
  openServiceIssue: boolean;
  retentionGatesEnabled: boolean;
  includeWinBackTouchpoint?: boolean;
}

export interface RetentionTouchpointDecision {
  touchpoint: CustomerMessageTouchpoint;
  allowed: boolean;
  reasonCode?: RetentionBlockReasonCode;
  automationRuleId: string | null;
  policyVersion: string;
  reason: string;
}

export interface RetentionGatesEvaluationResult {
  touchpoints: RetentionTouchpointDecision[];
}

export const RETENTION_ELIGIBLE_JOB_STATUSES: readonly JobStatus[] = [
  "completed",
  "invoiced",
  "paid",
  "closed"
] as const;
