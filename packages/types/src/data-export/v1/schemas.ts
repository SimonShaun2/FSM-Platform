import { z } from "zod";

import { DATA_EXPORT_MANIFEST_VERSION } from "./manifest.js";

export const DataExportFormatSchema = z.enum(["json", "csv_bundle"]);
export type DataExportFormat = z.infer<typeof DataExportFormatSchema>;

export const DataExportStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "expired"
]);
export type DataExportStatus = z.infer<typeof DataExportStatusSchema>;

export const CreateDataExportBodySchema = z.object({
  format: DataExportFormatSchema.default("json")
});
export type CreateDataExportBody = z.infer<typeof CreateDataExportBodySchema>;

export const DataExportSessionIdParamsSchema = z.object({
  id: z.string().uuid()
});
export type DataExportSessionIdParams = z.infer<typeof DataExportSessionIdParamsSchema>;

export const DataExportSessionResponseSchema = z.object({
  id: z.string().uuid(),
  status: DataExportStatusSchema,
  format: DataExportFormatSchema,
  manifestVersion: z.literal(DATA_EXPORT_MANIFEST_VERSION),
  progressPercent: z.number().int().min(0).max(100),
  fileName: z.string().nullable(),
  recordCounts: z.record(z.string(), z.number().int().nonnegative()),
  expiresAt: z.string().datetime().nullable(),
  completedAt: z.string().datetime().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string().datetime()
});
export type DataExportSessionResponse = z.infer<typeof DataExportSessionResponseSchema>;

export const EXPORT_QUEUE_JOB_NAMES = {
  tenantDataExport: "tenant-data-export"
} as const;

export interface TenantDataExportJobData {
  companyId: string;
  exportSessionId: string;
  requestedById: string;
}
