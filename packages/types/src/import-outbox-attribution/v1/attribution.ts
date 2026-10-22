import { z } from "zod";

import { UuidSchema } from "../../agent-control-plane/v1/zod-shared.js";

/** Segment for direct-job / growth attribution (FS-40 / FS-5). */
export const AttributionSegmentV1Schema = z.enum(["imported", "unknown"]);

export type AttributionSegmentV1 = z.infer<typeof AttributionSegmentV1Schema>;

export const AttributionProvenanceV1Schema = z
  .object({
    importSessionId: UuidSchema.optional(),
    adapterId: z.string().min(1).max(64),
    externalRef: z.string().min(1).max(255)
  })
  .strict();

export type AttributionProvenanceV1 = z.infer<typeof AttributionProvenanceV1Schema>;

export const EntityRefV1Schema = z
  .object({
    entityType: z.string().min(1).max(64),
    entityId: UuidSchema
  })
  .strict();

export type EntityRefV1 = z.infer<typeof EntityRefV1Schema>;

export const AttributionV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    segment: AttributionSegmentV1Schema,
    provenance: AttributionProvenanceV1Schema,
    entityRefs: z.array(EntityRefV1Schema).default([])
  })
  .strict();

export type AttributionV1 = z.infer<typeof AttributionV1Schema>;

export const IMPORT_OUTBOX_ATTRIBUTION_CONTRACT_ID = "fsm.control-plane.import-outbox-attribution.v1.0.0";

export function buildAdapterIdempotencyKey(adapterId: string, externalRef: string): string {
  return `${adapterId}:${externalRef}`;
}
