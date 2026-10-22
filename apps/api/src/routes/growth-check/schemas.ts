import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();

export const enqueueGrowthCheckScanBodySchema = z.object({
  targetUrl: z.string().url().max(2048),
  rubricId: z.string().min(1).max(64).optional(),
  idempotencyKey: z.string().min(8).max(128).optional()
});

export type EnqueueGrowthCheckScanBody = z.infer<typeof enqueueGrowthCheckScanBodySchema>;

export const enqueueGrowthCheckScanValidation = withZodValidation({
  body: enqueueGrowthCheckScanBodySchema
});

export const growthCheckScanIdParamsSchema = z.object({
  scanId: uuidSchema
});

export const getGrowthCheckScanValidation = withZodValidation({
  params: growthCheckScanIdParamsSchema
});
