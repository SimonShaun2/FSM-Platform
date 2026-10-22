import { z } from "zod";

export const OPERATOR_INBOX_UI_VERSION = "0.1.0";

export const OperatorInboxRiskLevelSchema = z.enum(["low", "medium", "high"]);
export type OperatorInboxRiskLevel = z.infer<typeof OperatorInboxRiskLevelSchema>;

export const OperatorOverridePathSchema = z.enum(["approve", "reject", "edit", "execute"]);
export type OperatorOverridePath = z.infer<typeof OperatorOverridePathSchema>;

export const OperatorInboxRecipientSchema = z.object({
  displayName: z.string(),
  channel: z.enum(["sms", "email"]).optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional()
});

export type OperatorInboxRecipient = z.infer<typeof OperatorInboxRecipientSchema>;

export const OperatorInboxProvenanceEventSchema = z.object({
  id: z.string().uuid(),
  eventType: z.string(),
  summary: z.string(),
  createdAt: z.string()
});

export type OperatorInboxProvenanceEvent = z.infer<typeof OperatorInboxProvenanceEventSchema>;

export const OperatorInboxProvenanceSchema = z.object({
  agentProduct: z.string(),
  actionType: z.string(),
  sourceEventIds: z.array(z.string().uuid()),
  sourceEvents: z.array(OperatorInboxProvenanceEventSchema),
  createdAt: z.string(),
  reason: z.string().nullable().optional(),
  confidence: z.number().nullable().optional(),
  policyVersion: z.string()
});

export type OperatorInboxProvenance = z.infer<typeof OperatorInboxProvenanceSchema>;

export const OperatorInboxProposedContentSchema = z.object({
  channel: z.enum(["sms", "email"]).optional(),
  subject: z.string().nullable().optional(),
  body: z.string()
});

export type OperatorInboxProposedContent = z.infer<typeof OperatorInboxProposedContentSchema>;

export const OperatorInboxItemSchema = z.object({
  contractVersion: z.literal(OPERATOR_INBOX_UI_VERSION),
  id: z.string().uuid(),
  state: z.string(),
  risk: OperatorInboxRiskLevelSchema,
  recipient: OperatorInboxRecipientSchema,
  proposedContent: OperatorInboxProposedContentSchema,
  consequences: z.array(z.string()),
  expiresAt: z.string(),
  overridePaths: z.array(OperatorOverridePathSchema),
  requiresApproval: z.boolean(),
  provenance: OperatorInboxProvenanceSchema,
  executionReceipt: z.record(z.unknown()).nullable().optional(),
  reviewerId: z.string().uuid().nullable().optional()
});

export type OperatorInboxItem = z.infer<typeof OperatorInboxItemSchema>;

export const EditAgentActionParametersSchema = z.object({
  channel: z.enum(["sms", "email"]).optional(),
  subject: z.string().max(998).nullable().optional(),
  body: z.string().min(1).max(16000)
});

export type EditAgentActionParametersInput = z.infer<typeof EditAgentActionParametersSchema>;
