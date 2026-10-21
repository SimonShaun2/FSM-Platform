import { z } from "zod";

export const AgentActionStateV1Schema = z.enum([
  "proposed",
  "policy_evaluated",
  "awaiting_approval",
  "approved",
  "executing",
  "succeeded",
  "failed",
  "expired",
  "cancelled",
  "escalated",
  "reversed"
]);

export type AgentActionStateV1 = z.infer<typeof AgentActionStateV1Schema>;
