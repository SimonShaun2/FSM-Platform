import { AppError, ErrorCode } from "@fsm/types";

export const AGENT_POLICY_V1 = "agent-policy-v1";

const REVENUE_ALLOWED_ACTION_TYPES = new Set([
  "context.resolve",
  "message.draft",
  "message.send_proposed",
  "revenue.inquiry.qualify"
]);

const AUTO_APPROVED_ACTION_TYPES = new Set(["context.resolve", "message.draft"]);

/** AI may create these proposals; execution still requires owner approval where applicable. */
const AI_PROPOSAL_ACTION_TYPES = new Set(["message.send_proposed", "revenue.inquiry.qualify"]);

export function assertPolicyVersion(policyVersion: string): void {
  if (policyVersion !== AGENT_POLICY_V1) {
    throw new AppError(ErrorCode.POLICY_DENIED, "Unsupported agent policy version");
  }
}

export function assertActionAllowedForProduct(
  agentProduct: string,
  actionType: string,
  actorType: "user" | "system" | "ai" | "customer"
): void {
  if (agentProduct === "revenue") {
    if (!REVENUE_ALLOWED_ACTION_TYPES.has(actionType)) {
      throw new AppError(ErrorCode.POLICY_DENIED, "Action type is not allowed for revenue agent");
    }
    if (actorType === "ai" && AI_PROPOSAL_ACTION_TYPES.has(actionType)) {
      return;
    }
    if (actorType === "ai" && !AUTO_APPROVED_ACTION_TYPES.has(actionType)) {
      throw new AppError(
        ErrorCode.POLICY_DENIED,
        "AI actor cannot perform this action without human approval"
      );
    }
    return;
  }

  throw new AppError(ErrorCode.POLICY_DENIED, "Agent product is not enabled");
}

export function requiresHumanApproval(actionType: string): boolean {
  if (actionType === "message.send_proposed") {
    return true;
  }
  return !AUTO_APPROVED_ACTION_TYPES.has(actionType);
}
