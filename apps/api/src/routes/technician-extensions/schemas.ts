import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u;

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

const timeEntrySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "jobId",
    "technicianId",
    "startedAt",
    "endedAt",
    "durationMinutes",
    "entryType",
    "notes",
    "travelFromAddress",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    jobId: { type: "string" },
    technicianId: { type: "string" },
    startedAt: { type: "string", format: "date-time" },
    endedAt: nullableDateTimeSchema,
    durationMinutes: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    entryType: { type: "string", enum: ["travel", "on_site", "break"] },
    notes: nullableStringSchema,
    travelFromAddress: nullableStringSchema,
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: nullableDateTimeSchema
  }
} as const;

const technicianSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "skills",
    "serviceAreaIds",
    "serviceZipCodes",
    "status",
    "calendarColor",
    "hoursPerDay",
    "notes",
    "totalJobsCompleted",
    "avgJobDurationMinutes",
    "estimateCloseRate",
    "avgTicketValue",
    "userId",
    "todayJobCount",
    "activeJobCount",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: nullableStringSchema,
    phone: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    serviceAreaIds: { type: "array", items: { type: "string" } },
    serviceZipCodes: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["active", "inactive", "on_leave"] },
    calendarColor: { type: "string" },
    hoursPerDay: { type: "string" },
    notes: nullableStringSchema,
    totalJobsCompleted: { type: "integer" },
    avgJobDurationMinutes: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    estimateCloseRate: nullableStringSchema,
    avgTicketValue: nullableStringSchema,
    userId: nullableStringSchema,
    todayJobCount: { type: "integer" },
    activeJobCount: { type: "integer" },
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

function isValidIsoDate(value: string): boolean {
  return !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime());
}

export const TechnicianIdParamsSchema = z.object({ id: uuidSchema }).strict();

export const TechnicianTimeQuerySchema = z
  .object({
    startDate: z.string().regex(isoDatePattern).refine(isValidIsoDate, "Invalid ISO date").optional(),
    endDate: z.string().regex(isoDatePattern).refine(isValidIsoDate, "Invalid ISO date").optional(),
    jobId: uuidSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export const ServiceAreaSchema = z.object({
  serviceZipCodes: z.array(z.string().trim().min(1)).min(1)
}).strict();

export type TechnicianIdParams = z.infer<typeof TechnicianIdParamsSchema>;
export type TechnicianTimeQuery = z.infer<typeof TechnicianTimeQuerySchema>;
export type ServiceAreaBody = z.infer<typeof ServiceAreaSchema>;

export const technicianTimeValidation = withZodValidation({
  params: TechnicianIdParamsSchema,
  query: TechnicianTimeQuerySchema
});
export const serviceAreaValidation = withZodValidation({
  params: TechnicianIdParamsSchema,
  body: ServiceAreaSchema
});

export const technicianTimeRouteSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: timeEntrySchema
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const serviceAreaRouteSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["technician"],
      properties: {
        technician: technicianSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
