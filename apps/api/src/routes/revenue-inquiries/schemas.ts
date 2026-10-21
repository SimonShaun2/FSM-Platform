import { z } from "zod";

import { inboxInquiryIntakeInputSchema, staffInquiryIntakeInputSchema } from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export const bookingRequestIdParamsSchema = z.object({
  bookingRequestId: z.string().uuid()
});

export const createInquiryResponseBodySchema = z.object({
  idempotencyKey: z.string().min(8).max(128)
});

export type CreateInquiryResponseBody = z.infer<typeof createInquiryResponseBodySchema>;

export const bookingRequestIdParamsValidation = withZodValidation({ params: bookingRequestIdParamsSchema });

export const createInquiryResponseValidation = withZodValidation({
  params: bookingRequestIdParamsSchema,
  body: createInquiryResponseBodySchema
});

export const staffInquiryIntakeValidation = withZodValidation({
  body: staffInquiryIntakeInputSchema
});

export const inboxInquiryIntakeValidation = withZodValidation({
  body: inboxInquiryIntakeInputSchema
});

export const getInquiryIntakeParamsSchema = z.object({
  bookingRequestId: z.string().uuid()
});

export const getInquiryIntakeValidation = withZodValidation({
  params: getInquiryIntakeParamsSchema
});
