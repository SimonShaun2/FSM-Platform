import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const isoDateSchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "must be a valid ISO date or date-time"
  });

export const jobSourceReportingQuerySchema = z.object({
  startDate: isoDateSchema,
  endDate: isoDateSchema
});

export const jobSourceReportingValidation = withZodValidation({
  query: jobSourceReportingQuerySchema
});

const channelSchema = {
  type: "object",
  additionalProperties: false,
  required: ["channel", "label", "bookedJobCount", "revenue", "shareOfBookedJobs", "jobIds"],
  properties: {
    channel: {
      type: "string",
      enum: ["own_website", "booking", "referrals", "repeat_customers", "imported_or_other"]
    },
    label: { type: "string" },
    bookedJobCount: { type: "integer" },
    revenue: { type: "string" },
    shareOfBookedJobs: { type: "number" },
    jobIds: {
      type: "array",
      items: { type: "string" }
    }
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

export const jobSourceReportingRouteSchema = {
  tags: ["reporting"],
  summary: "Job source reporting summary",
  querystring: {
    type: "object",
    additionalProperties: false,
    required: ["startDate", "endDate"],
    properties: {
      startDate: { type: "string" },
      endDate: { type: "string" }
    }
  },
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["period", "totals", "channels"],
      properties: {
        period: {
          type: "object",
          additionalProperties: false,
          required: ["startDate", "endDate"],
          properties: {
            startDate: { type: "string" },
            endDate: { type: "string" }
          }
        },
        totals: {
          type: "object",
          additionalProperties: false,
          required: ["bookedJobCount", "revenue", "unknownAttributionCount"],
          properties: {
            bookedJobCount: { type: "integer" },
            revenue: { type: "string" },
            unknownAttributionCount: { type: "integer" }
          }
        },
        channels: {
          type: "array",
          items: channelSchema
        }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;
