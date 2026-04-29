import { z } from "zod";

import { withZodValidation } from "../../shared/validation.js";

const errorResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error", "message", "requestId"],
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    requestId: { type: "string" }
  }
} as const;

export const TokenParamsSchema = z
  .object({
    token: z.string().min(32)
  })
  .strict();

export type TokenParams = z.infer<typeof TokenParamsSchema>;

export const publicPaymentValidation = withZodValidation({
  params: TokenParamsSchema
});

export const getPublicPaymentLinkSchema = {
  tags: ["public-payments"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["invoiceNumber", "paymentLinkUrl"],
      properties: {
        invoiceNumber: { type: "string" },
        paymentLinkUrl: { type: "string" }
      }
    },
    400: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;
