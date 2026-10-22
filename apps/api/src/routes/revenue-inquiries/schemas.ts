import { z } from "zod";

import {
  BookingRequestIdParamsV1Schema,
  CreateInquiryResponseBodyV1Schema,
  type CreateInquiryResponseBodyV1
} from "@fsm/types";

import { inboxInquiryIntakeInputSchema, staffInquiryIntakeInputSchema } from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export type CreateInquiryResponseBody = CreateInquiryResponseBodyV1;

export const bookingRequestIdParamsValidation = withZodValidation({ params: BookingRequestIdParamsV1Schema });

export const createInquiryResponseValidation = withZodValidation({
  params: BookingRequestIdParamsV1Schema,
  body: CreateInquiryResponseBodyV1Schema
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
