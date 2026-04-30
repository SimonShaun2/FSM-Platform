import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const reviewStatusSchema = z.enum(["pending", "sent", "clicked", "completed", "declined"]);
const reviewChannelSchema = z.enum(["sms", "email"]);

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

const reviewRequestSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "jobId",
    "customerId",
    "technicianId",
    "referenceId",
    "status",
    "channel",
    "reviewUrl",
    "sentAt",
    "clickedAt",
    "completedAt",
    "rating",
    "reviewText",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    jobId: nullableStringSchema,
    customerId: { type: "string" },
    technicianId: nullableStringSchema,
    referenceId: { type: "string" },
    status: { type: "string" },
    channel: { type: "string", enum: ["sms", "email"] },
    reviewUrl: nullableStringSchema,
    sentAt: nullableDateTimeSchema,
    clickedAt: nullableDateTimeSchema,
    completedAt: nullableDateTimeSchema,
    rating: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    reviewText: nullableStringSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: nullableDateTimeSchema
  }
} as const;

const listItemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "referenceId",
    "status",
    "channel",
    "sentAt",
    "completedAt",
    "rating",
    "customer",
    "technician",
    "job",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    referenceId: { type: "string" },
    status: { type: "string" },
    channel: { type: "string", enum: ["sms", "email"] },
    sentAt: nullableDateTimeSchema,
    completedAt: nullableDateTimeSchema,
    rating: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
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
    technician: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "firstName", "lastName"],
          properties: {
            id: { type: "string" },
            firstName: { type: "string" },
            lastName: { type: "string" }
          }
        },
        { type: "null" }
      ]
    },
    job: {
      anyOf: [
        {
          type: "object",
          additionalProperties: false,
          required: ["id", "jobNumber", "title"],
          properties: {
            id: { type: "string" },
            jobNumber: { type: "string" },
            title: { type: "string" }
          }
        },
        { type: "null" }
      ]
    },
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

export const ReviewRequestIdParamsSchema = z.object({ id: uuidSchema }).strict();

export const ReviewRequestListQuerySchema = z.object({
  status: reviewStatusSchema.optional(),
  channel: reviewChannelSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25)
}).strict();

export const UpdateReviewRequestSchema = z.object({
  status: reviewStatusSchema.optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  reviewText: z.string().trim().optional()
}).strict().refine((input) => Object.keys(input).length > 0, {
  message: "At least one field is required"
});

export type ReviewRequestIdParams = z.infer<typeof ReviewRequestIdParamsSchema>;
export type ReviewRequestListQuery = z.infer<typeof ReviewRequestListQuerySchema>;

export const listReviewRequestsValidation = withZodValidation({
  query: ReviewRequestListQuerySchema
});
export const updateReviewRequestValidation = withZodValidation({
  params: ReviewRequestIdParamsSchema,
  body: UpdateReviewRequestSchema
});

export const listReviewRequestsRouteSchema = {
  tags: ["review-requests"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages", "stats"],
      properties: {
        data: {
          type: "array",
          items: listItemSchema
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" },
        stats: {
          type: "object",
          additionalProperties: false,
          required: ["pending", "sent", "clicked", "completed", "declined"],
          properties: {
            pending: { type: "integer" },
            sent: { type: "integer" },
            clicked: { type: "integer" },
            completed: { type: "integer" },
            declined: { type: "integer" }
          }
        }
      }
    },
    401: errorResponseSchema
  }
} as const;

export const updateReviewRequestRouteSchema = {
  tags: ["review-requests"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["reviewRequest"],
      properties: {
        reviewRequest: reviewRequestSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
