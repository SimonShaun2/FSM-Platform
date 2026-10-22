import { z } from "zod";

import { AgentActionStateV1Schema } from "./agent-action-state.js";
import { AgentProductV1Schema } from "./tenant-context.js";
import { ContextResolveParamsV1Schema } from "./tools/context-resolve.params.js";
import { IdempotencyKeyV1Schema, UuidSchema } from "./zod-shared.js";

/** Path params — agent action by id (approve / reject / execute / get). */
export const AgentActionIdParamsV1Schema = z
  .object({
    id: UuidSchema
  })
  .strict();

export type AgentActionIdParamsV1 = z.infer<typeof AgentActionIdParamsV1Schema>;

/** Query — approvals inbox list (FS-14 / agent-actions). */
export const ListAgentActionsQueryV1Schema = z
  .object({
    state: AgentActionStateV1Schema.optional(),
    agentProduct: AgentProductV1Schema.optional()
  })
  .strict();

export type ListAgentActionsQueryV1 = z.infer<typeof ListAgentActionsQueryV1Schema>;

/** Path params — revenue inquiry / booking request anchor routes. */
export const BookingRequestIdParamsV1Schema = z
  .object({
    bookingRequestId: UuidSchema
  })
  .strict();

export type BookingRequestIdParamsV1 = z.infer<typeof BookingRequestIdParamsV1Schema>;

/** Body — POST revenue inquiry response draft (creates message.send_proposed proposal). */
export const CreateInquiryResponseBodyV1Schema = z
  .object({
    idempotencyKey: IdempotencyKeyV1Schema
  })
  .strict();

export type CreateInquiryResponseBodyV1 = z.infer<typeof CreateInquiryResponseBodyV1Schema>;

/**
 * Body — POST tenant-context resolve (subset of {@link ContextResolveParamsV1Schema}).
 */
export const ResolveEntityBodyV1Schema = ContextResolveParamsV1Schema.pick({
  entityType: true,
  entityId: true
}).strict();

export type ResolveEntityBodyV1 = z.infer<typeof ResolveEntityBodyV1Schema>;
