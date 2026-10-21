import { z } from "zod";

import { ContractVersionV1Schema, UuidSchema } from "./zod-shared.js";

export const AgentQueueEnvelopeV1Schema = z.object({
  contractVersion: ContractVersionV1Schema,
  companyId: UuidSchema,
  proposalId: UuidSchema,
  idempotencyKey: z.string().min(1).max(256)
});

export type AgentQueueEnvelopeV1 = z.infer<typeof AgentQueueEnvelopeV1Schema>;

export function parseAgentQueueEnvelopeV1(input: unknown): AgentQueueEnvelopeV1 {
  return AgentQueueEnvelopeV1Schema.parse(input);
}
