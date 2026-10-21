export const CUSTOMER_MESSAGE_METADATA_VERSION = "0.1.2";

export type ConsentScope = "appointment" | "marketing";

export type CustomerMessageTouchpoint =
  | "retention_thank_you"
  | "retention_issue_check"
  | "retention_rebook_offer"
  | "retention_review_request"
  /** Batch 2 (FS-28): lapse reactivation for residential cleaning — PO extension pending FS-8 table */
  | "retention_win_back_offer";

export interface CustomerMessageEntityLinks {
  jobId: string;
  customerId: string;
  maintenanceVisitId?: string | null;
  maintenancePlanId?: string | null;
}

export interface CustomerMessageProposalMetadata {
  contractVersion: typeof CUSTOMER_MESSAGE_METADATA_VERSION;
  domain: "retention";
  touchpoint: CustomerMessageTouchpoint;
  consentScope: ConsentScope;
  entityLinks: CustomerMessageEntityLinks;
  prerequisiteProposalId: string;
  automationRuleId: string | null;
  attributionKey: string;
  policyVersion: string;
}

export type JobCompletionConfirmProposalStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "executing"
  | "succeeded"
  | "failed"
  | "cancelled";

export interface JobCompletionConfirmSnapshot {
  id: string;
  companyId: string;
  jobId: string;
  status: JobCompletionConfirmProposalStatus;
}

export const RETENTION_POST_SERVICE_TOUCHPOINTS: readonly CustomerMessageTouchpoint[] = [
  "retention_thank_you",
  "retention_issue_check",
  "retention_rebook_offer",
  "retention_review_request"
] as const;

export function defaultConsentScopeForTouchpoint(
  touchpoint: CustomerMessageTouchpoint
): ConsentScope {
  switch (touchpoint) {
    case "retention_thank_you":
    case "retention_issue_check":
      return "appointment";
    case "retention_rebook_offer":
    case "retention_review_request":
    case "retention_win_back_offer":
      return "marketing";
    default: {
      const exhaustive: never = touchpoint;
      return exhaustive;
    }
  }
}

export function buildRetentionAttributionKey(
  companyId: string,
  jobId: string,
  touchpoint: CustomerMessageTouchpoint
): string {
  return `retention:${companyId}:${jobId}:${touchpoint}`;
}

export function buildProposalCreateIdempotencyKey(params: {
  companyId: string;
  kind: "customer_message";
  entityId: string;
  triggerEventId: string;
}): string {
  return `proposal:create:${params.companyId}:${params.kind}:${params.entityId}:${params.triggerEventId}`;
}
