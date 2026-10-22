import type { ErrorCode } from "../errors.js";
import type { ConsentScope } from "../pair4/proposal-factory-v0_1_2.js";

export const OUTBOUND_AUTHORIZATION_POLICY_V1 = "outbound-authorization-v1";

export type OutboundAuthorizationKind = "agent_action_execute" | "queued_outreach";

export type OutboundAuthorizationFailureCode =
  | "CROSS_TENANT_ACCESS"
  | "FORGED_IDENTITY"
  | "STALE_CONSENT"
  | "CONSENT_REVOKED"
  | "CONSENT_REQUIRED"
  | "POLICY_DENIED"
  | "UNAUTHORIZED_SEND";

export interface ChannelConsentSnapshot {
  consentScope: ConsentScope;
  /** ISO timestamp when the customer granted this scope. */
  capturedAt: string;
  /** Monotonic consent record version at capture time. */
  consentVersion: number;
  appointmentOptIn: boolean;
  marketingOptIn: boolean;
  /** When set, outreach captured on or before this instant is invalid. */
  revokedAt: string | null;
  /** Latest consent version for the customer (execute-time truth). */
  currentConsentVersion: number;
}

export interface OutboundAuthorizationActor {
  companyId: string;
  actorId: string;
  actorType: "user" | "system" | "ai" | "customer";
  /** Optional forged tenant claim (must match companyId). */
  assertedCompanyId?: string;
}

export interface OutboundAuthorizationInput {
  policyVersion: string;
  kind: OutboundAuthorizationKind;
  resourceCompanyId: string;
  actor: OutboundAuthorizationActor;
  channel: "sms" | "email";
  actionType: string;
  consent: ChannelConsentSnapshot;
  customer: {
    doNotContact: boolean;
    prefersSms: boolean;
    prefersEmail: boolean;
  };
  approval?: {
    required: boolean;
    approved: boolean;
  };
}

export interface OutboundAuthorizationDecision {
  allowed: boolean;
  policyVersion: string;
  reason: string;
  failureCode?: OutboundAuthorizationFailureCode;
  errorCode?: ErrorCode;
}
