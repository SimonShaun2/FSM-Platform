import {
  AgentActionIdParamsV1Schema,
  ListAgentActionsQueryV1Schema,
  type ListAgentActionsQueryV1
} from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export type ListAgentActionsQuery = ListAgentActionsQueryV1;

export const agentActionIdValidation = withZodValidation({ params: AgentActionIdParamsV1Schema });
export const listAgentActionsValidation = withZodValidation({ query: ListAgentActionsQueryV1Schema });
