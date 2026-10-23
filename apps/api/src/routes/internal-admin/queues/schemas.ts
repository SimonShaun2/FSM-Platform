import { z } from "zod";

import { PlatformQueueNameV1Schema } from "@fsm/types";

export const listDeadLetterJobsParamsSchema = z.object({
  queueName: PlatformQueueNameV1Schema
});

export const listDeadLetterJobsQuerySchema = z.object({
  start: z.coerce.number().int().min(0).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional()
});
