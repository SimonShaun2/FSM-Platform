import {
  BookingRequestIdParamsV1Schema,
  ResolveEntityBodyV1Schema,
  type ResolveEntityBodyV1
} from "@fsm/types";

import { withZodValidation } from "../shared/validation.js";

export type ResolveEntityBody = ResolveEntityBodyV1;

export const resolveEntityValidation = withZodValidation({ body: ResolveEntityBodyV1Schema });

export const inquiryAnchorParamsValidation = withZodValidation({ params: BookingRequestIdParamsV1Schema });
