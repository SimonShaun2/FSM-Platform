import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;
const bookingSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const bookingStatusSchema = z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]);
const bookingSourceSchema = z.enum(["google", "facebook", "instagram", "yelp", "direct", "website", "qr_code"]);

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }]
} as const;

const nullableDateTimeSchema = {
  anyOf: [{ type: "string", format: "date-time" }, { type: "null" }]
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

const bookingRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "customerId",
    "jobId",
    "assignedTechnicianId",
    "firstName",
    "lastName",
    "phone",
    "email",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "zip",
    "propertyType",
    "serviceCategory",
    "serviceType",
    "serviceDetail",
    "urgency",
    "customerNotes",
    "preferredDate",
    "preferredWindow",
    "status",
    "source",
    "referenceNumber",
    "isPropertyOwner",
    "smsConsentAppointments",
    "smsConsentMarketing",
    "confirmedAt",
    "confirmedById",
    "confirmationSentAt",
    "cancelledAt",
    "cancellationReason",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    customerId: nullableStringSchema,
    jobId: nullableStringSchema,
    assignedTechnicianId: nullableStringSchema,
    firstName: { type: "string" },
    lastName: { type: "string" },
    phone: { type: "string" },
    email: nullableStringSchema,
    addressLine1: { type: "string" },
    addressLine2: nullableStringSchema,
    city: { type: "string" },
    state: { type: "string" },
    zip: { type: "string" },
    propertyType: nullableStringSchema,
    serviceCategory: nullableStringSchema,
    serviceType: nullableStringSchema,
    serviceDetail: nullableStringSchema,
    urgency: nullableStringSchema,
    customerNotes: nullableStringSchema,
    preferredDate: nullableStringSchema,
    preferredWindow: nullableStringSchema,
    status: { type: "string" },
    source: { type: "string" },
    referenceNumber: nullableStringSchema,
    isPropertyOwner: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    smsConsentAppointments: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    smsConsentMarketing: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    confirmedAt: nullableDateTimeSchema,
    confirmedById: nullableStringSchema,
    confirmationSentAt: nullableDateTimeSchema,
    cancelledAt: nullableDateTimeSchema,
    cancellationReason: nullableStringSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: nullableDateTimeSchema
  }
} as const;

const bookingSettingsSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "isEnabled",
    "bookingSlug",
    "offeredServices",
    "availableHoursStart",
    "availableHoursEnd",
    "availableDays",
    "slotDuration",
    "maxAdvanceDays",
    "autoConfirm",
    "googleReviewUrl",
    "yelpReviewUrl",
    "facebookReviewUrl",
    "allowZipOverflow",
    "balanceWorkload",
    "notifyOnNewBooking",
    "notificationEmail",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    isEnabled: { type: "boolean" },
    bookingSlug: nullableStringSchema,
    offeredServices: {
      type: "array",
      items: { type: "object", additionalProperties: true }
    },
    availableHoursStart: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    availableHoursEnd: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    availableDays: {
      type: "array",
      items: { type: "string" }
    },
    slotDuration: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    maxAdvanceDays: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    autoConfirm: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    googleReviewUrl: nullableStringSchema,
    yelpReviewUrl: nullableStringSchema,
    facebookReviewUrl: nullableStringSchema,
    customReviewUrl: nullableStringSchema,
    tagline: nullableStringSchema,
    allowZipOverflow: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    balanceWorkload: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    notifyOnNewBooking: {
      anyOf: [{ type: "boolean" }, { type: "null" }]
    },
    notificationEmail: nullableStringSchema,
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

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

export const BookingRequestIdParamsSchema = z.object({
  id: uuidSchema
}).strict();

export const BookingRequestListQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
  source: bookingSourceSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
}).strict();

export const BookingAnalyticsQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30)
}).strict();

export const BookingSlugAvailabilityQuerySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(bookingSlugPattern, "slug must use lowercase letters, numbers, and hyphens only")
}).strict();

export const ConfirmBookingRequestSchema = z.object({
  technicianId: uuidSchema,
  scheduledStart: z.string().datetime({ offset: true }),
  scheduledEnd: z.string().datetime({ offset: true })
}).strict();

export const DeclineBookingRequestSchema = z.object({
  reason: z.string().trim().optional()
}).strict();

export const InitiateBookingHandoffSchema = z.object({
  targetSystem: z.string().trim().min(2).max(100),
  operatorNotes: z.string().trim().max(2000).optional()
}).strict();

export const ReconcileBookingHandoffSchema = z
  .object({
    outcome: z.enum(["succeeded", "failed"]),
    externalReference: z.string().trim().min(1).max(255).optional(),
    failureReason: z.string().trim().min(1).max(2000).optional()
  })
  .strict()
  .superRefine((input, ctx) => {
    if (input.outcome === "succeeded" && !input.externalReference) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "externalReference is required when outcome is succeeded",
        path: ["externalReference"]
      });
    }

    if (input.outcome === "failed" && !input.failureReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "failureReason is required when outcome is failed",
        path: ["failureReason"]
      });
    }
  });

export const BookingHandoffIdParamsSchema = BookingRequestIdParamsSchema.extend({
  handoffId: uuidSchema
});

export const UpdateBookingSettingsSchema = buildUpdateSchema({
  isEnabled: z.boolean().optional(),
  bookingSlug: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .regex(bookingSlugPattern, "bookingSlug must use lowercase letters, numbers, and hyphens only")
    .optional(),
  offeredServices: z.array(z.record(z.unknown())).optional(),
  availableHoursStart: z.coerce.number().int().min(0).max(23).optional(),
  availableHoursEnd: z.coerce.number().int().min(1).max(24).optional(),
  availableDays: z.array(z.string().trim().min(1)).optional(),
  slotDuration: z.coerce.number().int().min(1).max(12).optional(),
  maxAdvanceDays: z.coerce.number().int().min(1).max(30).optional(),
  autoConfirm: z.boolean().optional(),
  googleReviewUrl: z.string().trim().url().nullable().optional(),
  yelpReviewUrl: z.string().trim().url().nullable().optional(),
  facebookReviewUrl: z.string().trim().url().nullable().optional(),
  customReviewUrl: z.string().trim().url().nullable().optional(),
  tagline: z.string().trim().max(160).nullable().optional(),
  allowZipOverflow: z.boolean().optional(),
  balanceWorkload: z.boolean().optional(),
  notifyOnNewBooking: z.boolean().optional(),
  notificationEmail: z.string().trim().email().nullable().optional()
}).refine((input) => {
  if (input.availableHoursStart === undefined || input.availableHoursEnd === undefined) {
    return true;
  }

  return input.availableHoursEnd > input.availableHoursStart;
}, {
  message: "availableHoursEnd must be after availableHoursStart",
  path: ["availableHoursEnd"]
});

export type BookingRequestIdParams = z.infer<typeof BookingRequestIdParamsSchema>;
export type BookingHandoffIdParams = z.infer<typeof BookingHandoffIdParamsSchema>;
export type BookingAnalyticsQuery = z.infer<typeof BookingAnalyticsQuerySchema>;
export type BookingSlugAvailabilityQuery = z.infer<typeof BookingSlugAvailabilityQuerySchema>;

export const bookingRequestListValidation = withZodValidation({
  query: BookingRequestListQuerySchema
});
export const bookingAnalyticsValidation = withZodValidation({
  query: BookingAnalyticsQuerySchema
});
export const bookingSlugAvailabilityValidation = withZodValidation({
  query: BookingSlugAvailabilityQuerySchema
});
export const bookingRequestIdValidation = withZodValidation({
  params: BookingRequestIdParamsSchema
});
export const confirmBookingRequestValidation = withZodValidation({
  params: BookingRequestIdParamsSchema,
  body: ConfirmBookingRequestSchema
});
export const declineBookingRequestValidation = withZodValidation({
  params: BookingRequestIdParamsSchema,
  body: DeclineBookingRequestSchema
});
export const updateBookingSettingsValidation = withZodValidation({
  body: UpdateBookingSettingsSchema
});
export const initiateBookingHandoffValidation = withZodValidation({
  params: BookingRequestIdParamsSchema,
  body: InitiateBookingHandoffSchema
});
export const reconcileBookingHandoffValidation = withZodValidation({
  params: BookingHandoffIdParamsSchema,
  body: ReconcileBookingHandoffSchema
});

export const bookingRequestListRouteSchema = {
  tags: ["booking"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "id",
              "referenceNumber",
              "status",
              "source",
              "firstName",
              "lastName",
              "phone",
              "zip",
              "serviceCategory",
              "serviceType",
              "preferredDate",
              "preferredWindow",
              "assignedTechnicianId",
              "createdAt"
            ],
            properties: {
              id: { type: "string" },
              referenceNumber: nullableStringSchema,
              status: { type: "string" },
              source: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              phone: { type: "string" },
              zip: { type: "string" },
              serviceCategory: nullableStringSchema,
              serviceType: nullableStringSchema,
              preferredDate: nullableStringSchema,
              preferredWindow: nullableStringSchema,
              assignedTechnicianId: nullableStringSchema,
              createdAt: { type: "string", format: "date-time" }
            }
          }
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" }
      }
    },
    401: errorResponseSchema
  }
} as const;

export const bookingRequestRouteSchema = {
  tags: ["booking"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["bookingRequest"],
      properties: {
        bookingRequest: bookingRequestSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const bookingSettingsRouteSchema = {
  tags: ["booking"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["settings"],
      properties: {
        settings: bookingSettingsSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema
  }
} as const;

export const bookingSlugAvailabilityRouteSchema = {
  tags: ["booking"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["slug", "available"],
      properties: {
        slug: { type: "string" },
        available: { type: "boolean" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema
  }
} as const;

export const bookingRequestStatsRouteSchema = {
  tags: ["booking"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["stats"],
      properties: {
        stats: {
          type: "object",
          additionalProperties: false,
          required: ["totalRequests", "confirmationRate", "confirmedBookings", "estimatedRevenue", "bySource"],
          properties: {
            totalRequests: { type: "integer" },
            confirmationRate: { type: "integer" },
            confirmedBookings: { type: "integer" },
            estimatedRevenue: { type: "string" },
            bySource: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["source", "count"],
                properties: {
                  source: { type: "string" },
                  count: { type: "integer" }
                }
              }
            }
          }
        }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;

const bookingHandoffResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "bookingRequestId",
    "targetSystem",
    "status",
    "externalReference",
    "failureReason",
    "operatorNotes",
    "initiatedById",
    "reconciledById",
    "reconciledAt",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string", format: "uuid" },
    companyId: { type: "string", format: "uuid" },
    bookingRequestId: { type: "string", format: "uuid" },
    targetSystem: { type: "string" },
    status: { type: "string", enum: ["pending_external", "succeeded", "failed"] },
    externalReference: nullableStringSchema,
    failureReason: nullableStringSchema,
    operatorNotes: nullableStringSchema,
    initiatedById: { type: "string", format: "uuid" },
    reconciledById: { anyOf: [{ type: "string", format: "uuid" }, { type: "null" }] },
    reconciledAt: nullableDateTimeSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: nullableDateTimeSchema
  }
} as const;

export const bookingHandoffRouteSchema = {
  tags: ["booking"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["handoff"],
      properties: {
        handoff: bookingHandoffResponseSchema
      }
    },
    200: {
      type: "object",
      additionalProperties: false,
      required: ["handoff"],
      properties: {
        handoff: bookingHandoffResponseSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const bookingDemandByZipRouteSchema = {
  tags: ["booking"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["zip", "count"],
            properties: {
              zip: { type: "string" },
              count: { type: "integer" }
            }
          }
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
