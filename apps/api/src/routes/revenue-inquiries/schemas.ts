import {
  BookingRequestIdParamsV1Schema,
  CreateInquiryResponseBodyV1Schema,
  type CreateInquiryResponseBodyV1
} from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export type CreateInquiryResponseBody = CreateInquiryResponseBodyV1;

export const bookingRequestIdParamsValidation = withZodValidation({ params: BookingRequestIdParamsV1Schema });

export const createInquiryResponseValidation = withZodValidation({
  params: BookingRequestIdParamsV1Schema,
  body: CreateInquiryResponseBodyV1Schema
});
