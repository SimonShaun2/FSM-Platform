import { z } from "zod";

import { CanonicalEntityTypeV1Schema } from "../entity-ref.schema.js";
import { UuidSchema } from "../zod-shared.js";

export const ContextResolveParamsV1Schema = z.object({
  entityType: CanonicalEntityTypeV1Schema,
  entityId: UuidSchema,
  /** When true, include related graph refs in resolve output (FS-10). */
  includeRelated: z.boolean().optional()
});

export type ContextResolveParamsV1 = z.infer<typeof ContextResolveParamsV1Schema>;
