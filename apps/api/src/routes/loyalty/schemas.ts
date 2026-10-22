import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

export const listLoyaltyReminderCandidatesQuerySchema = z
  .object({
    horizonDays: z.coerce.number().int().min(1).max(90).optional()
  })
  .strict();

export const listLoyaltyReminderCandidatesValidation = withZodValidation({
  query: listLoyaltyReminderCandidatesQuerySchema
});
