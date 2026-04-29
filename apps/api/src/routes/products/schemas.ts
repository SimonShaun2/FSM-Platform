import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const productCategorySchema = z.enum(["service", "labor", "material", "equipment", "fee", "bundle"]);

const nullableStringSchema = {
  anyOf: [{ type: "string" }, { type: "null" }]
} as const;

const nullableDateTimeSchema = {
  anyOf: [{ type: "string", format: "date-time" }, { type: "null" }]
} as const;

const nullableBooleanSchema = {
  anyOf: [{ type: "boolean" }, { type: "null" }]
} as const;

const nullableIntegerSchema = {
  anyOf: [{ type: "integer" }, { type: "null" }]
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

const productSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "name",
    "description",
    "category",
    "sku",
    "unitPrice",
    "cost",
    "unit",
    "isTaxable",
    "isActive",
    "applicableAssetTypes",
    "sortOrder",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    name: { type: "string" },
    description: nullableStringSchema,
    category: { type: "string", enum: ["service", "labor", "material", "equipment", "fee", "bundle"] },
    sku: nullableStringSchema,
    unitPrice: { type: "string" },
    cost: nullableStringSchema,
    unit: nullableStringSchema,
    isTaxable: nullableBooleanSchema,
    isActive: { type: "boolean" },
    applicableAssetTypes: {
      type: "array",
      items: { type: "string" }
    },
    sortOrder: nullableIntegerSchema,
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

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

export const ProductIdParamsSchema = z
  .object({
    id: uuidSchema
  })
  .strict();

export const ListProductsQuerySchema = z
  .object({
    category: productCategorySchema.optional(),
    isActive: z.preprocess(parseOptionalBoolean, z.boolean().optional()),
    search: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50)
  })
  .strict();

export const SearchProductsQuerySchema = z
  .object({
    q: z.string().trim().min(1)
  })
  .strict();

export const CreateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().optional(),
    category: productCategorySchema.optional().default("service"),
    sku: z.string().trim().max(100).optional(),
    unitPrice: z.coerce.number().min(0),
    cost: z.coerce.number().min(0).optional(),
    unit: z.string().trim().max(50).optional(),
    isTaxable: z.boolean().optional().default(true),
    isActive: z.boolean().optional().default(true),
    applicableAssetTypes: z.array(z.string().trim().min(1)).optional().default([]),
    sortOrder: z.coerce.number().int().min(0).optional().default(0)
  })
  .strict();

export const UpdateProductSchema = buildUpdateSchema({
  name: z.string().trim().min(1).max(255).optional(),
  description: z.string().trim().optional(),
  category: productCategorySchema.optional(),
  sku: z.string().trim().max(100).optional(),
  unitPrice: z.coerce.number().min(0).optional(),
  cost: z.coerce.number().min(0).optional(),
  unit: z.string().trim().max(50).optional(),
  isTaxable: z.boolean().optional(),
  isActive: z.boolean().optional(),
  applicableAssetTypes: z.array(z.string().trim().min(1)).optional(),
  sortOrder: z.coerce.number().int().min(0).optional()
});

export type ProductIdParams = z.infer<typeof ProductIdParamsSchema>;
export type SearchProductsQuery = z.infer<typeof SearchProductsQuerySchema>;

export const listProductsValidation = withZodValidation({ query: ListProductsQuerySchema });
export const searchProductsValidation = withZodValidation({ query: SearchProductsQuerySchema });
export const createProductValidation = withZodValidation({ body: CreateProductSchema });
export const productIdValidation = withZodValidation({ params: ProductIdParamsSchema });
export const updateProductValidation = withZodValidation({
  params: ProductIdParamsSchema,
  body: UpdateProductSchema
});

export const listProductsSchema = {
  tags: ["products"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: productSchema
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

export const searchProductsSchema = {
  tags: ["products"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["products"],
      properties: {
        products: {
          type: "array",
          items: productSchema
        }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;

export const createProductRouteSchema = {
  tags: ["products"],
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["product"],
      properties: {
        product: productSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const getProductSchema = {
  tags: ["products"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["product"],
      properties: {
        product: productSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const updateProductRouteSchema = {
  tags: ["products"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["product"],
      properties: {
        product: productSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const deleteProductSchema = {
  tags: ["products"],
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
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;
