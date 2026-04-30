import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

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

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

export const DispatchDateQuerySchema = z.object({
  date: z.string().regex(isoDatePattern).refine(isValidIsoDate, "Invalid ISO date")
}).strict();

export type DispatchDateQuery = z.infer<typeof DispatchDateQuerySchema>;

export const dispatchDateValidation = withZodValidation({
  query: DispatchDateQuerySchema
});

export const dispatchViewRouteSchema = {
  tags: ["dispatch"],
  response: {
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;

export const dispatchWorkloadRouteSchema = dispatchViewRouteSchema;
export const listUnscheduledJobsRouteSchema = dispatchViewRouteSchema;
export const listApprovedUnconvertedEstimatesRouteSchema = dispatchViewRouteSchema;
export const autoFitRouteSchema = {
  tags: ["dispatch"],
  response: {
    501: {
      type: "object",
      additionalProperties: false,
      required: ["message"],
      properties: {
        message: { type: "string" }
      }
    },
    401: errorResponseSchema
  }
} as const;
