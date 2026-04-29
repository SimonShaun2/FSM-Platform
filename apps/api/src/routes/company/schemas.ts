import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }]
} as const;

const companyResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "slug",
    "phone",
    "email",
    "website",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "zip",
    "timezone",
    "logoUrl",
    "settings",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    slug: { type: "string" },
    phone: nullableStringSchema,
    email: nullableStringSchema,
    website: nullableStringSchema,
    addressLine1: nullableStringSchema,
    addressLine2: nullableStringSchema,
    city: nullableStringSchema,
    state: nullableStringSchema,
    zip: nullableStringSchema,
    timezone: { type: "string" },
    logoUrl: nullableStringSchema,
    settings: {
      type: "object",
      additionalProperties: true
    },
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

const errorResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["error", "message", "requestId"],
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    requestId: { type: "string" },
    fields: {
      anyOf: [
        {
          type: "object",
          additionalProperties: { type: "string" }
        },
        { type: "null" }
      ]
    }
  }
} as const;

export const UpdateCompanySchema = z
  .object({
    name: z.string().trim().min(2).max(255).optional(),
    phone: z.string().trim().min(1).optional(),
    email: z.string().trim().email().optional(),
    website: z.string().trim().url().optional(),
    addressLine1: z.string().trim().min(1).optional(),
    addressLine2: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1).optional(),
    state: z.string().trim().min(1).optional(),
    zip: z.string().trim().min(1).optional(),
    timezone: z.string().trim().min(1).optional(),
    logoUrl: z.string().trim().url().optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required"
  });

export type UpdateCompanyInput = z.infer<typeof UpdateCompanySchema>;

export const updateCompanyValidation = withZodValidation({ body: UpdateCompanySchema });

export const getCompanyRouteSchema = {
  tags: ["company"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["company"],
      properties: {
        company: companyResponseSchema
      }
    },
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const updateCompanyRouteSchema = {
  tags: ["company"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["company"],
      properties: {
        company: companyResponseSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
