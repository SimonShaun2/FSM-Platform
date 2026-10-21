import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

export const agentActionIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const listAgentActionsQuerySchema = z.object({
  state: z
    .enum([
      "proposed",
      "policy_evaluated",
      "awaiting_approval",
      "approved",
      "executing",
      "succeeded",
      "failed",
      "expired",
      "cancelled",
      "escalated"
    ])
    .optional(),
  agentProduct: z.enum(["revenue", "scheduling", "service", "retention", "owner"]).optional()
});

export type ListAgentActionsQuery = z.infer<typeof listAgentActionsQuerySchema>;

export const agentActionIdValidation = withZodValidation({ params: agentActionIdParamsSchema });
export const listAgentActionsValidation = withZodValidation({ query: listAgentActionsQuerySchema });
