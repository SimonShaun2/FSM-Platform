import { ErrorCode } from "../../errors.js";

/**
 * Normative FS-37 negative-test → {@link ErrorCode} mapping (ADR-FS-3 U5).
 * Runtime services throw {@link AppError} with these codes; HTTP via {@link getHttpStatusForErrorCode}.
 */
export const AGENT_CONTROL_PLANE_ERROR_CODES = {
  /** FS37-NT-06 — stale {@link buildRecordVersionV1} at execute */
  staleRecordVersion: ErrorCode.CONFLICT,
  /** FS37-NT-03 / U8 — same idempotency key, different payload */
  idempotencyPayloadMismatch: ErrorCode.CONFLICT,
  /** FS37-NT-05 — expired proposal at execute */
  expiredProposal: ErrorCode.CONFLICT,
  /** FS37-NT-07 — tool not in tenant allowlist */
  toolNotAllowed: ErrorCode.POLICY_DENIED,
  /** FS37-NT-11 — AI actor blocked from money mutation without approval */
  moneyStateWithoutApproval: ErrorCode.POLICY_DENIED,
  /** FS37-NT-08 — outbound consent guard */
  consentRequired: ErrorCode.CONSENT_REQUIRED,
  /** FS37-NT-09 / U7 — wrong-tenant entity */
  tenantEntityNotFound: ErrorCode.NOT_FOUND
} as const;

export type AgentControlPlaneErrorCode =
  (typeof AGENT_CONTROL_PLANE_ERROR_CODES)[keyof typeof AGENT_CONTROL_PLANE_ERROR_CODES];
