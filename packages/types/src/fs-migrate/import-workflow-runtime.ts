import { z } from "zod";

import { ContractVersionV1Schema, IdempotencyKeyV1Schema, UuidSchema } from "../agent-control-plane/v1/zod-shared.js";

import { IMPORT_CHUNK_COMMIT_JOB_NAME } from "./import-chunk-commit.js";

export const IMPORT_WORKFLOW_CONTRACT_VERSION = "1.0.0";

export const IMPORT_POLICY_V1 = "import-policy-v1";

export const ImportWorkflowStepKindV1Schema = z.enum([
  IMPORT_CHUNK_COMMIT_JOB_NAME,
  "migrate-file-batch",
  "import-post-commit-campaigns",
]);

export type ImportWorkflowStepKindV1 = z.infer<typeof ImportWorkflowStepKindV1Schema>;

export const ImportPolicyVersionV1Schema = z.literal(IMPORT_POLICY_V1);

export const ImportWorkflowQueueEnvelopeV1Schema = z.object({
  contractVersion: ContractVersionV1Schema,
  companyId: UuidSchema,
  importSessionId: UuidSchema,
  stepKind: ImportWorkflowStepKindV1Schema,
  idempotencyKey: IdempotencyKeyV1Schema,
  policyVersion: ImportPolicyVersionV1Schema,
});

export type ImportWorkflowQueueEnvelopeV1 = z.infer<typeof ImportWorkflowQueueEnvelopeV1Schema>;

export const ImportWorkflowStepStateV1Schema = z.enum(["scheduled", "deduped_completed"]);

export type ImportWorkflowStepStateV1 = z.infer<typeof ImportWorkflowStepStateV1Schema>;

export const ImportWorkflowAuditPayloadV1Schema = z.object({
  contractVersion: z.literal(IMPORT_WORKFLOW_CONTRACT_VERSION),
  policyVersion: ImportPolicyVersionV1Schema,
  stepKind: ImportWorkflowStepKindV1Schema,
  idempotencyKey: IdempotencyKeyV1Schema,
  state: ImportWorkflowStepStateV1Schema,
  importSessionId: UuidSchema,
  importBundleId: UuidSchema.optional(),
  chunkIndex: z.number().int().nonnegative().optional(),
  jobId: z.string().min(1).max(256).optional(),
});

export type ImportWorkflowAuditPayloadV1 = z.infer<typeof ImportWorkflowAuditPayloadV1Schema>;

export function parseImportWorkflowQueueEnvelopeV1(input: unknown): ImportWorkflowQueueEnvelopeV1 {
  return ImportWorkflowQueueEnvelopeV1Schema.parse(input);
}

export function buildImportWorkflowAuditPayloadV1(
  input: Omit<ImportWorkflowAuditPayloadV1, "contractVersion" | "policyVersion">,
): ImportWorkflowAuditPayloadV1 {
  return ImportWorkflowAuditPayloadV1Schema.parse({
    contractVersion: IMPORT_WORKFLOW_CONTRACT_VERSION,
    policyVersion: IMPORT_POLICY_V1,
    ...input,
  });
}
