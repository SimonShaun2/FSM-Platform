import { z } from "zod";

export const IMPORT_CHUNK_COMMIT_JOB_NAME = "import-chunk-commit";

const importEntityTypeSchema = z.enum([
  "customers",
  "properties",
  "assets",
  "jobs",
  "estimates",
  "invoices",
]);

export const ImportChunkCommitPayloadSchema = z.object({
  companyId: z.string().uuid(),
  importSessionId: z.string().uuid(),
  importBundleId: z.string().uuid().optional(),
  sourceSystem: z.string().min(1).max(64),
  entityType: importEntityTypeSchema,
  chunkIndex: z.number().int().nonnegative(),
  chunksTotal: z.number().int().positive(),
  cursor: z.object({
    byteOffset: z.number().int().nonnegative().optional(),
    rowOffset: z.number().int().nonnegative().optional(),
    lastSourceId: z.string().optional(),
  }),
  idempotencyKey: z.string().min(1).max(255),
  rowWindow: z
    .object({
      start: z.number().int().nonnegative(),
      end: z.number().int().nonnegative(),
    })
    .optional(),
});

export type ImportChunkCommitPayload = z.infer<typeof ImportChunkCommitPayloadSchema>;

export function buildImportChunkIdempotencyKey(
  importSessionId: string,
  entityType: string,
  chunkIndex: number,
): string {
  return `${importSessionId}:${entityType}:${chunkIndex}`;
}
