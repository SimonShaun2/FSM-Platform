import { z } from "zod";

import { CANONICAL_ENTITY_TYPES_V1 } from "./entity-ref.js";
import { ContractVersionV1Schema, IsoDateTimeSchema, RecordVersionV1Schema, UuidSchema } from "./zod-shared.js";

export const CanonicalEntityTypeV1Schema = z.enum(CANONICAL_ENTITY_TYPES_V1);

export const ProvenanceSourceV1Schema = z.object({
  channel: z.string().min(1),
  externalId: z.string().min(1).optional(),
  importSessionId: UuidSchema.optional()
});

export const CanonicalEntityRefV1Schema = z.object({
  contractVersion: ContractVersionV1Schema,
  entityType: CanonicalEntityTypeV1Schema,
  entityId: UuidSchema,
  companyId: UuidSchema,
  observedAt: IsoDateTimeSchema,
  recordVersion: RecordVersionV1Schema,
  source: ProvenanceSourceV1Schema.optional()
});

export type ProvenanceSourceV1 = z.infer<typeof ProvenanceSourceV1Schema>;
