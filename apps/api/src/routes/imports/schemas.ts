import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const importSessionStatusSchema = z.enum([
  "uploaded",
  "mapping",
  "preview",
  "importing",
  "completed",
  "failed",
  "rolled_back"
]);
const importEntityTypeSchema = z.enum([
  "customers",
  "jobs",
  "price_book",
  "notes",
  "communications"
]);

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

const importSessionSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "status",
    "entityType",
    "fileName",
    "totalRows",
    "validRows",
    "errorRows",
    "importedRows",
    "skippedRows",
    "duplicateRows",
    "columnMappings",
    "completedAt",
    "rolledBackAt",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    status: { type: "string" },
    entityType: { type: "string" },
    fileName: { type: "string" },
    totalRows: { anyOf: [{ type: "integer" }, { type: "null" }] },
    validRows: { anyOf: [{ type: "integer" }, { type: "null" }] },
    errorRows: { anyOf: [{ type: "integer" }, { type: "null" }] },
    importedRows: { anyOf: [{ type: "integer" }, { type: "null" }] },
    skippedRows: { anyOf: [{ type: "integer" }, { type: "null" }] },
    duplicateRows: { anyOf: [{ type: "integer" }, { type: "null" }] },
    columnMappings: {
      type: "object",
      additionalProperties: {
        anyOf: [{ type: "string" }, { type: "null" }]
      }
    },
    completedAt: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }]
    },
    rolledBackAt: {
      anyOf: [{ type: "string", format: "date-time" }, { type: "null" }]
    },
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

const validationErrorSchema = {
  type: "object",
  additionalProperties: false,
  required: ["row", "field", "message", "value"],
  properties: {
    row: { type: "integer" },
    field: { type: "string" },
    message: { type: "string" },
    value: { type: "string" }
  }
} as const;

export const ImportSessionIdParamsSchema = z
  .object({
    id: uuidSchema
  })
  .strict();

export const ConfirmMappingSchema = z
  .object({
    mappingOverrides: z.record(z.string(), z.string().trim().min(1).nullable()).optional().default({})
  })
  .strict();

export const StartImportSchema = z
  .object({
    duplicateActions: z
      .record(z.string(), z.enum(["skip", "update_existing", "import_new"]))
      .optional()
      .default({})
  })
  .strict()
  .default({
    duplicateActions: {}
  });

export const ListImportsQuerySchema = z
  .object({
    status: importSessionStatusSchema.optional(),
    entityType: importEntityTypeSchema.optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
  })
  .strict();

export type ConfirmMappingBody = z.infer<typeof ConfirmMappingSchema>;
export type ImportSessionIdParams = z.infer<typeof ImportSessionIdParamsSchema>;
export type StartImportBody = z.infer<typeof StartImportSchema>;

export const confirmMappingValidation = withZodValidation({
  params: ImportSessionIdParamsSchema,
  body: ConfirmMappingSchema
});
export const importSessionIdValidation = withZodValidation({
  params: ImportSessionIdParamsSchema
});
export const startImportValidation = withZodValidation({
  params: ImportSessionIdParamsSchema,
  body: StartImportSchema
});
export const listImportsValidation = withZodValidation({
  query: ListImportsQuerySchema
});

export const createImportRouteSchema = {
  tags: ["imports"],
  consumes: ["multipart/form-data"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["importSession"],
      properties: {
        importSession: importSessionSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema
  }
} as const;

export const listImportsRouteSchema = {
  tags: ["imports"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: importSessionSchema
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema
  }
} as const;

export const getImportRouteSchema = {
  tags: ["imports"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["importSession"],
      properties: {
        importSession: importSessionSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const confirmMappingRouteSchema = getImportRouteSchema;
export const startImportRouteSchema = getImportRouteSchema;
export const rollbackImportRouteSchema = getImportRouteSchema;

export const importErrorsRouteSchema = {
  tags: ["imports"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["errors"],
      properties: {
        errors: {
          type: "array",
          items: validationErrorSchema
        }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const importIngestProgressRouteSchema = {
  tags: ["imports"],
  response: {
    200: {
      type: "object",
      additionalProperties: true
    },
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
