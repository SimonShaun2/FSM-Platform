import { z } from "zod";

import { EditAgentActionParametersSchema } from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";
import { listAgentActionsQuerySchema } from "../agent-actions/schemas.js";

export const operatorInboxIdParamsSchema = z.object({
  id: z.string().uuid()
});

export const jobProvenanceParamsSchema = z.object({
  jobId: z.string().uuid()
});

export const jobProvenanceQuerySchema = z.object({
  eventIds: z.string().min(1)
});

export const editAgentActionBodySchema = EditAgentActionParametersSchema;

export type EditAgentActionBody = z.infer<typeof editAgentActionBodySchema>;

export const operatorInboxIdValidation = withZodValidation({ params: operatorInboxIdParamsSchema });
export const listOperatorInboxValidation = withZodValidation({ query: listAgentActionsQuerySchema });
export const jobProvenanceValidation = withZodValidation({
  params: jobProvenanceParamsSchema,
  query: jobProvenanceQuerySchema
});
export const editAgentActionValidation = withZodValidation({
  params: operatorInboxIdParamsSchema,
  body: editAgentActionBodySchema
});
