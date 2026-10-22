import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

const schedulingSelectionBodySchema = z.object({
  technicianId: uuidSchema,
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime()
});

export const schedulingBookingRequestIdParamsSchema = z.object({
  bookingRequestId: uuidSchema
});

export type SchedulingBookingRequestIdParams = z.infer<typeof schedulingBookingRequestIdParamsSchema>;

export const listSchedulingOptionsQuerySchema = z.object({
  startDate: z.string().regex(isoDatePattern).optional()
});

export const schedulingBookingRequestIdValidation = withZodValidation({
  params: schedulingBookingRequestIdParamsSchema
});

export const listSchedulingOptionsValidation = withZodValidation({
  params: schedulingBookingRequestIdParamsSchema,
  query: listSchedulingOptionsQuerySchema
});

export const selectSchedulingOptionValidation = withZodValidation({
  params: schedulingBookingRequestIdParamsSchema,
  body: schedulingSelectionBodySchema
});

export const confirmSchedulingOptionValidation = withZodValidation({
  params: schedulingBookingRequestIdParamsSchema,
  body: schedulingSelectionBodySchema
});
