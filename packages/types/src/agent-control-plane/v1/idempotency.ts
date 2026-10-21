import { AppError, ErrorCode } from "../../errors.js";

export interface IdempotencyReplayContext {
  companyId: string;
  idempotencyKey: string;
  payloadFingerprint: string;
}

/**
 * FS37-NT-03 — same tenant + key with a different payload fingerprint → CONFLICT.
 * Callers compute a stable fingerprint (e.g. hash of canonical JSON parameters).
 */
export function assertIdempotencyPayloadMatches(
  existingFingerprint: string,
  incoming: IdempotencyReplayContext
): void {
  if (existingFingerprint !== incoming.payloadFingerprint) {
    throw new AppError(
      ErrorCode.CONFLICT,
      "Idempotency key was already used with a different payload",
      { idempotencyKey: incoming.idempotencyKey }
    );
  }
}
