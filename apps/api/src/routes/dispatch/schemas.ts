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

/** SSE clients pass `access_token` in query (EventSource cannot set Authorization). */
export const DispatchStreamDateQuerySchema = z
  .object({
    date: z.string().regex(isoDatePattern).refine(isValidIsoDate, "Invalid ISO date"),
    access_token: z.string().min(1).optional()
  })
  .strict();

export type DispatchStreamDateQuery = z.infer<typeof DispatchStreamDateQuerySchema>;

export const AutoFitBodySchema = z.object({
  jobId: z.string().uuid(),
  date: z.string().regex(isoDatePattern).refine(isValidIsoDate, "Invalid ISO date")
}).strict();

export type AutoFitBody = z.infer<typeof AutoFitBodySchema>;

export const dispatchDateValidation = withZodValidation({
  query: DispatchDateQuerySchema
});

export const dispatchStreamDateValidation = withZodValidation({
  query: DispatchStreamDateQuerySchema
});

export const autoFitValidation = withZodValidation({
  body: AutoFitBodySchema
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
    200: {
      type: "object",
      additionalProperties: false,
      required: ["suggestions", "message"],
      properties: {
        suggestions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "technicianId",
              "technicianName",
              "scheduledStart",
              "scheduledEnd",
              "score",
              "scoreBreakdown",
              "reasoningText"
            ],
            properties: {
              technicianId: { type: "string" },
              technicianName: { type: "string" },
              scheduledStart: { type: "string", format: "date-time" },
              scheduledEnd: { type: "string", format: "date-time" },
              score: { type: "integer" },
              scoreBreakdown: {
                type: "object",
                additionalProperties: false,
                required: ["zipMatch", "skillsMatch", "utilizationScore", "gapFitScore"],
                properties: {
                  zipMatch: { type: "integer" },
                  skillsMatch: { type: "integer" },
                  utilizationScore: { type: "integer" },
                  gapFitScore: { type: "integer" }
                }
              },
              reasoningText: { type: "string" }
            }
          }
        },
        message: {
          anyOf: [{ type: "string" }, { type: "null" }]
        }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;
