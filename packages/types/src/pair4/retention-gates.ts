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

export interface RetentionCustomerChannelPrefs {
  prefersSms: boolean;
  prefersEmail: boolean;
  doNotContact: boolean;
  marketingOptIn: boolean;
  appointmentOptIn: boolean;
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
