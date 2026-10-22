import type { FieldWorkSyncOperationOutcome } from "./constants.js";
import { parseRecordVersionV1 } from "../../agent-control-plane/v1/entity-ref.js";

export interface FieldWorkSyncVersionConflict {
  liveRecordVersion: string;
  reason: string;
}

export function buildFieldWorkSyncVersionConflict(
  liveRecordVersion: string,
  reason: string
): {
  outcome: "conflict";
  resultPayload: { conflict: FieldWorkSyncVersionConflict };
} {
  return {
    outcome: "conflict",
    resultPayload: {
      conflict: {
        liveRecordVersion,
        reason
      }
    }
  };
}

export type FieldWorkSyncReplayDecision =
  | { action: "replay_stored"; outcome: FieldWorkSyncOperationOutcome }
  | { action: "duplicate" }
  | { action: "reject"; message: string };

/**
 * Idempotent replay rules for clientOperationId (per company).
 * Same id + same payload hash → duplicate; same id + different hash → reject (no silent overwrite).
 */
export function resolveFieldWorkSyncClientOperationReplay(input: {
  storedPayloadHash: string;
  incomingPayloadHash: string;
  storedOutcome: FieldWorkSyncOperationOutcome;
}): FieldWorkSyncReplayDecision {
  if (input.storedPayloadHash !== input.incomingPayloadHash) {
    return {
      action: "reject",
      message: "clientOperationId reused with a different payload"
    };
  }

  if (input.storedOutcome === "applied") {
    return { action: "duplicate" };
  }

  return { action: "replay_stored", outcome: input.storedOutcome };
}

export function validateJobTaskBaseRecordVersion(
  baseRecordVersion: string,
  taskId: string
): { ok: true } | { ok: false; message: string } {
  const parsed = parseRecordVersionV1(baseRecordVersion);
  if (!parsed || parsed.entityType !== "job_task" || parsed.entityId !== taskId) {
    return {
      ok: false,
      message: "baseRecordVersion must target the job task being updated"
    };
  }

  return { ok: true };
}
