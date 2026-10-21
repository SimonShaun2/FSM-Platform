import { z } from "zod";

import { AGENT_CONTROL_PLANE_VERSION } from "./constants.js";
import { parseRecordVersionV1 } from "./entity-ref.js";

export const ContractVersionV1Schema = z.literal(AGENT_CONTROL_PLANE_VERSION);

export const UuidSchema = z.string().uuid();

/** Shared idempotency key bounds (proposals + inquiry response). */
export const IdempotencyKeyV1Schema = z.string().min(1).max(256);

export const IsoDateTimeSchema = z.string().datetime({ offset: true });

/** ADR-FS-3 U4 — must parse via {@link parseRecordVersionV1}. */
export const RecordVersionV1Schema = z.string().refine(
  (value) => parseRecordVersionV1(value) !== null,
  { message: "recordVersion must be rv1:{entityType}:{entityId}:{iso8601}" }
);
