import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();

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

const automationRuleSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "companyId",
    "ruleType",
    "isEnabled",
    "delayHours",
    "thresholdDays",
    "config",
    "createdAt",
    "updatedAt",
    "deletedAt"
  ],
  properties: {
    id: { type: "string" },
    companyId: { type: "string" },
    ruleType: { type: "string" },
    isEnabled: { type: "boolean" },
    delayHours: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    thresholdDays: {
      anyOf: [{ type: "integer" }, { type: "null" }]
    },
    config: {
      type: "object",
      additionalProperties: true
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
    deletedAt: nullableDateTimeSchema
  }
} as const;

export const AutomationRuleParamsSchema = z.object({
  id: uuidSchema
}).strict();

export const UpdateAutomationRuleSchema = z
  .object({
    isEnabled: z.boolean().optional(),
    delayHours: z.coerce.number().int().min(0).nullable().optional(),
    thresholdDays: z.coerce.number().int().min(0).nullable().optional(),
    config: z.record(z.unknown()).nullable().optional()
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required"
  });

export type AutomationRuleParams = z.infer<typeof AutomationRuleParamsSchema>;

export const automationRuleIdValidation = withZodValidation({
  params: AutomationRuleParamsSchema
});

export const updateAutomationRuleValidation = withZodValidation({
  body: UpdateAutomationRuleSchema
});

export const automationRuleListRouteSchema = {
  tags: ["automation-rules"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["rules"],
      properties: {
        rules: {
          type: "array",
          items: automationRuleSchema
        }
      }
    },
    401: errorResponseSchema,
    403: errorResponseSchema
  }
} as const;

export const automationRuleRouteSchema = {
  tags: ["automation-rules"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["rule"],
      properties: {
        rule: automationRuleSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
