import { z } from "zod";

import { CANONICAL_ENTITY_TYPES_V1 } from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export const resolveEntityBodySchema = z.object({
  entityType: z.enum(CANONICAL_ENTITY_TYPES_V1),
  entityId: z.string().uuid()
});

export type ResolveEntityBody = z.infer<typeof resolveEntityBodySchema>;

export const resolveEntityValidation = withZodValidation({ body: resolveEntityBodySchema });

export const inquiryAnchorParamsSchema = z.object({
  bookingRequestId: z.string().uuid()
});

export const inquiryAnchorParamsValidation = withZodValidation({ params: inquiryAnchorParamsSchema });
