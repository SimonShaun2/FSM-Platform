import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/u, "Expected ISO date (YYYY-MM-DD)");
const maintenancePlanFrequencySchema = z.enum(["monthly", "bi_monthly", "quarterly", "bi_annual", "annual"]);
const maintenancePlanStatusSchema = z.enum(["active", "paused", "expired", "cancelled"]);
const billingCycleSchema = z.enum(["monthly", "annual"]);
const decimalStringSchema = z.string().regex(/^\d+(?:\.\d{1,2})?$/u, "Expected a decimal amount");

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }]
} as const;

const nullableDateTimeSchema = {
  anyOf: [{ type: "string", format: "date-time" }, { type: "null" }]
} as const;

const nullableDateSchema = {
  anyOf: [{ type: "string" }, { type: "null" }]
} as const;

const nullableBillingCycleSchema = {
  anyOf: [{ type: "string", enum: ["monthly", "annual"] }, { type: "null" }]
} as const;

const nullableStripeStatusSchema = {
  anyOf: [
    {
      type: "string",
      enum: [
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "paused",
        "trialing",
        "unpaid"
      ]
    },
    { type: "null" }
  ]
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

const templateSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "description",
    "visitsPerYear",
    "frequency",
    "monthlyPrice",
    "annualPrice",
    "applicableAssetTypes",
    "sortOrder",
    "isActive"
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: nullableStringSchema,
    visitsPerYear: { type: "integer" },
    frequency: { type: "string" },
    monthlyPrice: nullableStringSchema,
    annualPrice: nullableStringSchema,
    applicableAssetTypes: {
      type: "array",
      items: { type: "string" }
    },
    sortOrder: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    isActive: { type: "boolean" }
  }
} as const;

const agreementListItemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "status",
    "frequency",
    "nextServiceDate",
    "lastServiceDate",
    "price",
    "billingCycle",
    "stripeStatus",
    "stripeCurrentPeriodEnd",
    "stripeCancelAtPeriodEnd",
    "customer",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    status: { type: "string" },
    frequency: { type: "string" },
    nextServiceDate: nullableDateSchema,
    lastServiceDate: nullableDateSchema,
    price: nullableStringSchema,
    billingCycle: nullableBillingCycleSchema,
    stripeStatus: nullableStripeStatusSchema,
    stripeCurrentPeriodEnd: nullableDateTimeSchema,
    stripeCancelAtPeriodEnd: { type: "boolean" },
    customer: {
      type: "object",
      additionalProperties: false,
      required: ["id", "firstName", "lastName"],
      properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" }
      }
    },
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

const agreementDetailSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "description",
    "status",
    "frequency",
    "startDate",
    "endDate",
    "nextServiceDate",
    "lastServiceDate",
    "price",
    "billingCycle",
    "stripeStatus",
    "stripeCancelAtPeriodEnd",
    "stripeCurrentPeriodEnd",
    "paymentMethodLabel",
    "retryPaymentUrl",
    "latestInvoiceAmountDue",
    "latestInvoiceDueDate",
    "includedServices",
    "notes",
    "customer",
    "property",
    "template",
    "assets",
    "recentVisits"
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: nullableStringSchema,
    status: { type: "string" },
    frequency: { type: "string" },
    startDate: { type: "string" },
    endDate: nullableDateSchema,
    nextServiceDate: nullableDateSchema,
    lastServiceDate: nullableDateSchema,
    price: nullableStringSchema,
    billingCycle: nullableBillingCycleSchema,
    stripeStatus: nullableStripeStatusSchema,
    stripeCancelAtPeriodEnd: { type: "boolean" },
    stripeCurrentPeriodEnd: nullableDateTimeSchema,
    paymentMethodLabel: nullableStringSchema,
    retryPaymentUrl: nullableStringSchema,
    latestInvoiceAmountDue: nullableStringSchema,
    latestInvoiceDueDate: nullableDateSchema,
    includedServices: {
      type: "array",
      items: { type: "string" }
    },
    notes: nullableStringSchema,
    customer: {
      type: "object",
      additionalProperties: false,
      required: ["id", "firstName", "lastName", "phone", "email"],
      properties: {
        id: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        phone: nullableStringSchema,
        email: nullableStringSchema
      }
    },
    property: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "addressLine1", "city", "state"],
          properties: {
            id: { type: "string" },
            addressLine1: { type: "string" },
            city: { type: "string" },
            state: { type: "string" }
          }
        },
        { type: "null" }
      ]
    },
    template: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "name", "visitsPerYear", "frequency"],
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            visitsPerYear: { type: "integer" },
            frequency: { type: "string" }
          }
        },
        { type: "null" }
      ]
    },
    assets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "name", "assetType"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          assetType: { type: "string" }
        }
      }
    },
    recentVisits: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "completedDate", "notes", "jobId"],
        properties: {
          id: { type: "string" },
          completedDate: { type: "string" },
          notes: nullableStringSchema,
          jobId: nullableStringSchema
        }
      }
    }
  }
} as const;

const maintenanceVisitSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "maintenancePlanId",
    "jobId",
    "scheduledDate",
    "completedDate",
    "notes",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    maintenancePlanId: { type: "string" },
    jobId: nullableStringSchema,
    scheduledDate: nullableDateSchema,
    completedDate: nullableDateSchema,
    notes: nullableStringSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: nullableDateTimeSchema
  }
} as const;

function buildUpdateSchema<T extends z.ZodRawShape>(shape: T) {
  return z
    .object(shape)
    .strict()
    .refine((input) => Object.keys(input).length > 0, {
      message: "At least one field is required"
    });
}

export const ServiceAgreementIdParamsSchema = z
  .object({
    id: uuidSchema
  })
  .strict();

export const CreateTemplateSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().optional(),
    includedServices: z.array(z.string().trim().min(1)).optional().default([]),
    visitsPerYear: z.number().int().min(1).max(52),
    frequency: maintenancePlanFrequencySchema,
    monthlyPrice: decimalStringSchema.optional(),
    annualPrice: decimalStringSchema.optional(),
    applicableAssetTypes: z.array(z.string().trim().min(1)).optional().default([]),
    sortOrder: z.number().int().optional().default(0),
    notes: z.string().trim().optional()
  })
  .strict();

export const UpdateTemplateSchema = buildUpdateSchema({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  includedServices: z.array(z.string().trim().min(1)).optional(),
  visitsPerYear: z.number().int().min(1).max(52).optional(),
  frequency: maintenancePlanFrequencySchema.optional(),
  monthlyPrice: decimalStringSchema.optional(),
  annualPrice: decimalStringSchema.optional(),
  applicableAssetTypes: z.array(z.string().trim().min(1)).optional(),
  sortOrder: z.number().int().optional(),
  notes: z.string().trim().optional(),
  isActive: z.boolean().optional()
});

export const CreateAgreementSchema = z
  .object({
    customerId: uuidSchema,
    serviceAgreementTemplateId: uuidSchema.optional(),
    propertyId: uuidSchema.optional(),
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().optional(),
    frequency: maintenancePlanFrequencySchema,
    startDate: isoDateSchema,
    billingEnabled: z.boolean().optional().default(false),
    billingCycle: billingCycleSchema.optional(),
    assetIds: z.array(uuidSchema).optional().default([]),
    notes: z.string().trim().optional()
  })
  .strict()
  .refine((input) => !input.billingEnabled || input.billingCycle !== undefined, {
    message: "billingCycle is required when billingEnabled is true",
    path: ["billingCycle"]
  });

export const UpdateAgreementSchema = buildUpdateSchema({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  nextServiceDate: isoDateSchema.optional(),
  assetIds: z.array(uuidSchema).optional(),
  frequency: maintenancePlanFrequencySchema.optional()
});

export const CancelAgreementSchema = z
  .object({
    cancelImmediately: z.boolean().optional().default(false),
    reason: z.string().trim().optional()
  })
  .strict();

export const RecordVisitSchema = z
  .object({
    completedDate: isoDateSchema,
    jobId: uuidSchema.optional(),
    notes: z.string().trim().optional()
  })
  .strict();

export const ListAgreementsQuerySchema = z
  .object({
    status: maintenancePlanStatusSchema.optional(),
    customerId: uuidSchema.optional(),
    templateId: uuidSchema.optional(),
    search: z.string().trim().min(1).max(120).optional(),
    expiresAfter: isoDateSchema.optional(),
    expiresBefore: isoDateSchema.optional(),
    sortBy: z.enum(["nextServiceDate", "createdAt", "status"]).default("nextServiceDate"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export type ServiceAgreementIdParams = z.infer<typeof ServiceAgreementIdParamsSchema>;
export type CancelAgreementBody = z.infer<typeof CancelAgreementSchema>;

export const templateIdValidation = withZodValidation({ params: ServiceAgreementIdParamsSchema });
export const createTemplateValidation = withZodValidation({ body: CreateTemplateSchema });
export const updateTemplateValidation = withZodValidation({
  params: ServiceAgreementIdParamsSchema,
  body: UpdateTemplateSchema
});
export const listAgreementsValidation = withZodValidation({ query: ListAgreementsQuerySchema });
export const createAgreementValidation = withZodValidation({ body: CreateAgreementSchema });
export const agreementIdValidation = withZodValidation({ params: ServiceAgreementIdParamsSchema });
export const updateAgreementValidation = withZodValidation({
  params: ServiceAgreementIdParamsSchema,
  body: UpdateAgreementSchema
});
export const cancelAgreementValidation = withZodValidation({
  params: ServiceAgreementIdParamsSchema,
  body: CancelAgreementSchema
});
export const pauseAgreementValidation = withZodValidation({ params: ServiceAgreementIdParamsSchema });
export const recordVisitValidation = withZodValidation({
  params: ServiceAgreementIdParamsSchema,
  body: RecordVisitSchema
});
export const listVisitsValidation = withZodValidation({ params: ServiceAgreementIdParamsSchema });
export const retryPaymentValidation = withZodValidation({ params: ServiceAgreementIdParamsSchema });

export const listTemplatesSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["templates"],
      properties: {
        templates: {
          type: "array",
          items: templateSchema
        }
      }
    },
    401: errorResponseSchema
  }
} as const;

export const createTemplateRouteSchema = {
  tags: ["service-agreements"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["template"],
      properties: {
        template: templateSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const updateTemplateRouteSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["template"],
      properties: {
        template: templateSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const deleteTemplateRouteSchema = {
  tags: ["service-agreements"],
  response: {
    204: { type: "null" },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const listAgreementsSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: agreementListItemSchema
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;

export const createAgreementRouteSchema = {
  tags: ["service-agreements"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["agreement"],
      properties: {
        agreement: agreementDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const getAgreementRouteSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["agreement"],
      properties: {
        agreement: agreementDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const updateAgreementRouteSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["agreement"],
      properties: {
        agreement: agreementDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const cancelAgreementRouteSchema = updateAgreementRouteSchema;
export const pauseAgreementRouteSchema = updateAgreementRouteSchema;

export const retryPaymentRouteSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["retryPaymentUrl"],
      properties: {
        retryPaymentUrl: { type: "string" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const recordVisitRouteSchema = {
  tags: ["service-agreements"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["visit"],
      properties: {
        visit: maintenanceVisitSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const listVisitsRouteSchema = {
  tags: ["service-agreements"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["visits"],
      properties: {
        visits: {
          type: "array",
          items: maintenanceVisitSchema
        }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
