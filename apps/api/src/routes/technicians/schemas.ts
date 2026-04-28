import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const calendarColorPattern = /^#[0-9A-Fa-f]{6}$/;

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }]
} as const;

const nullableNumberSchema = {
  anyOf: [{ type: "number" }, { type: "null" }]
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

const technicianListItemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "firstName",
    "lastName",
    "email",
    "phone",
    "skills",
    "status",
    "calendarColor",
    "hoursPerDay",
    "totalJobsCompleted",
    "userId",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    email: nullableStringSchema,
    phone: { type: "string" },
    skills: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["active", "inactive", "on_leave"] },
    calendarColor: { type: "string" },
    hoursPerDay: { type: "string" },
    totalJobsCompleted: { type: "integer" },
    userId: nullableStringSchema,
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

const technicianDetailSchema = {
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
    status: { type: "string", enum: ["active", "inactive", "on_leave"] },
    calendarColor: { type: "string" },
    hoursPerDay: { type: "string" },
    notes: nullableStringSchema,
    totalJobsCompleted: { type: "integer" },
    avgJobDurationMinutes: nullableNumberSchema,
    estimateCloseRate: nullableStringSchema,
    avgTicketValue: nullableStringSchema,
    userId: nullableStringSchema,
    todayJobCount: { type: "integer" },
    activeJobCount: { type: "integer" },
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

const availabilitySlotSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "jobId", "isBlockedTime", "blockReason", "startTime", "endTime", "isConfirmed"],
  properties: {
    id: { type: "string" },
    jobId: nullableStringSchema,
    isBlockedTime: { type: "boolean" },
    blockReason: nullableStringSchema,
    startTime: { type: "string", format: "date-time" },
    endTime: { type: "string", format: "date-time" },
    isConfirmed: { type: "boolean" }
  }
} as const;

const availabilityResultSchema = {
  type: "object",
  additionalProperties: false,
  required: ["technicianId", "startDate", "endDate", "days"],
  properties: {
    technicianId: { type: "string" },
    startDate: { type: "string" },
    endDate: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["date", "totalBookedMinutes", "availableMinutes", "slots"],
        properties: {
          date: { type: "string" },
          totalBookedMinutes: { type: "integer" },
          availableMinutes: { type: "integer" },
          slots: {
            type: "array",
            items: availabilitySlotSchema
          }
        }
      }
    }
  }
} as const;

const performanceSummarySchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "technicianId",
    "totalJobsCompleted",
    "avgJobDurationMinutes",
    "estimateCloseRate",
    "avgTicketValue",
    "last30Days"
  ],
  properties: {
    technicianId: { type: "string" },
    totalJobsCompleted: { type: "integer" },
    avgJobDurationMinutes: nullableNumberSchema,
    estimateCloseRate: nullableStringSchema,
    avgTicketValue: nullableStringSchema,
    last30Days: {
      type: "object",
      additionalProperties: false,
      required: ["jobsCompleted", "revenue", "avgTicket"],
      properties: {
        jobsCompleted: { type: "integer" },
        revenue: { type: "string" },
        avgTicket: { type: "string" }
      }
    }
  }
} as const;

function parseStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) =>
      typeof entry === "string"
        ? entry
            .split(",")
            .map((part) => part.trim())
            .filter((part) => part.length > 0)
        : []
    );
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }

  return undefined;
}

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

export const TechnicianIdParamsSchema = z
  .object({
    id: uuidSchema
  })
  .strict();

export const CreateTechnicianSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    email: z.string().trim().email().optional(),
    phone: z.string().trim().min(1),
    skills: z.array(z.string().trim().min(1)).optional().default([]),
    serviceAreaIds: z.array(uuidSchema).optional().default([]),
    hoursPerDay: z.coerce.number().min(1).max(24).optional().default(8),
    status: z.enum(["active", "inactive", "on_leave"]).optional().default("active"),
    calendarColor: z.string().regex(calendarColorPattern).optional().default("#6366f1"),
    notes: z.string().trim().min(1).optional(),
    userId: uuidSchema.optional()
  })
  .strict();

export const UpdateTechnicianSchema = buildUpdateSchema({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).optional(),
  skills: z.array(z.string().trim().min(1)).optional(),
  serviceAreaIds: z.array(uuidSchema).optional(),
  hoursPerDay: z.coerce.number().min(1).max(24).optional(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
  calendarColor: z.string().regex(calendarColorPattern).optional(),
  notes: z.string().trim().min(1).optional(),
  userId: uuidSchema.optional()
});

export const ListTechniciansQuerySchema = z
  .object({
    status: z.enum(["active", "inactive", "on_leave"]).optional(),
    skills: z.preprocess(parseStringArray, z.array(z.string().trim().min(1)).optional()),
    sortBy: z.enum(["firstName", "totalJobsCompleted", "createdAt"]).default("firstName"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export const AvailabilityQuerySchema = z
  .object({
    startDate: z.string().regex(isoDatePattern, "Invalid ISO date").refine(isValidIsoDate, "Invalid ISO date"),
    endDate: z.string().regex(isoDatePattern, "Invalid ISO date").refine(isValidIsoDate, "Invalid ISO date")
  })
  .strict()
  .refine((input) => input.endDate >= input.startDate, {
    message: "endDate must be on or after startDate",
    path: ["endDate"]
  })
  .refine((input) => {
    const start = new Date(`${input.startDate}T00:00:00.000Z`);
    const end = new Date(`${input.endDate}T00:00:00.000Z`);
    const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

    return dayCount <= 30;
  }, {
    message: "Date range must be 30 days or fewer",
    path: ["endDate"]
  });

export const LinkUserSchema = z
  .object({
    userId: uuidSchema
  })
  .strict();

export type TechnicianIdParams = z.infer<typeof TechnicianIdParamsSchema>;
export type AvailabilityQuery = z.infer<typeof AvailabilityQuerySchema>;
export type LinkUserBody = z.infer<typeof LinkUserSchema>;

export const listTechniciansValidation = withZodValidation({ query: ListTechniciansQuerySchema });
export const createTechnicianValidation = withZodValidation({ body: CreateTechnicianSchema });
export const technicianIdValidation = withZodValidation({ params: TechnicianIdParamsSchema });
export const updateTechnicianValidation = withZodValidation({
  params: TechnicianIdParamsSchema,
  body: UpdateTechnicianSchema
});
export const availabilityValidation = withZodValidation({
  params: TechnicianIdParamsSchema,
  query: AvailabilityQuerySchema
});
export const linkUserValidation = withZodValidation({
  params: TechnicianIdParamsSchema,
  body: LinkUserSchema
});

export const listTechniciansSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: technicianListItemSchema
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

export const createTechnicianSchema = {
  tags: ["technicians"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["technician"],
      properties: {
        technician: technicianDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const getTechnicianSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["technician"],
      properties: {
        technician: technicianDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const updateTechnicianSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["technician"],
      properties: {
        technician: technicianDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const deleteTechnicianSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["success"],
      properties: {
        success: { type: "boolean" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const getTechnicianAvailabilitySchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["availability"],
      properties: {
        availability: availabilityResultSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const getTechnicianPerformanceSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["performance"],
      properties: {
        performance: performanceSummarySchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const linkUserToTechnicianSchema = {
  tags: ["technicians"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["technician"],
      properties: {
        technician: technicianDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;
