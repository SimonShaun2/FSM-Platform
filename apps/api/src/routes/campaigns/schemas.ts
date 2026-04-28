import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();
const campaignTypeSchema = z.enum([
  "reactivation",
  "estimate_follow_up",
  "invoice_reminder",
  "seasonal",
  "maintenance_reminder",
  "custom"
]);
const campaignStatusSchema = z.enum(["draft", "scheduled", "sending", "sent", "cancelled"]);
const channelSchema = z.enum(["sms", "email"]);

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

const customerSummarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["id", "firstName", "lastName"],
  properties: {
    id: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" }
  }
} as const;

const campaignListItemSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "type",
    "status",
    "channel",
    "recipientCount",
    "deliveredCount",
    "convertedCount",
    "revenueAttributed",
    "sentAt",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { type: "string" },
    status: { type: "string" },
    channel: { type: "string" },
    recipientCount: { type: "integer" },
    deliveredCount: { type: "integer" },
    convertedCount: { type: "integer" },
    revenueAttributed: { type: "string" },
    sentAt: nullableDateTimeSchema,
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

const campaignRecipientSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "customer",
    "sentToPhone",
    "sentToEmail",
    "sentAt",
    "deliveredAt",
    "convertedAt"
  ],
  properties: {
    id: { type: "string" },
    customer: customerSummarySchema,
    sentToPhone: nullableStringSchema,
    sentToEmail: nullableStringSchema,
    sentAt: nullableDateTimeSchema,
    deliveredAt: nullableDateTimeSchema,
    convertedAt: nullableDateTimeSchema,
    status: {
      anyOf: [{ type: "string" }, { type: "null" }]
    }
  }
} as const;

const campaignDetailSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "name",
    "type",
    "status",
    "channel",
    "body",
    "subject",
    "isAiGenerated",
    "recipientCount",
    "deliveredCount",
    "openedCount",
    "repliedCount",
    "convertedCount",
    "revenueAttributed",
    "sentAt",
    "createdAt",
    "recipients"
  ],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    type: { type: "string" },
    status: { type: "string" },
    channel: { type: "string" },
    body: nullableStringSchema,
    subject: nullableStringSchema,
    isAiGenerated: { type: "boolean" },
    recipientCount: { type: "integer" },
    deliveredCount: { type: "integer" },
    openedCount: { type: "integer" },
    repliedCount: { type: "integer" },
    convertedCount: { type: "integer" },
    revenueAttributed: { type: "string" },
    sentAt: nullableDateTimeSchema,
    createdAt: { type: "string", format: "date-time" },
    recipients: {
      type: "array",
      items: campaignRecipientSchema
    }
  }
} as const;

export const CampaignIdParamsSchema = z
  .object({
    id: uuidSchema
  })
  .strict();

export const CreateCampaignSchema = z
  .object({
    name: z.string().trim().min(1).max(255),
    type: campaignTypeSchema,
    channel: channelSchema,
    recommendationIds: z.array(uuidSchema).min(1),
    subject: z.string().trim().min(1).max(255).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.channel === "email" && !value.subject) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "subject is required for email campaigns",
        path: ["subject"]
      });
    }
  });

export const UpdateCampaignSchema = z
  .object({
    body: z.string().trim().min(1).optional(),
    subject: z.string().trim().min(1).max(255).optional(),
    channel: channelSchema.optional()
  })
  .strict();

export const ListCampaignsQuerySchema = z
  .object({
    status: campaignStatusSchema.optional(),
    type: campaignTypeSchema.optional(),
    channel: channelSchema.optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export const ListRecipientsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export type CampaignIdParams = z.infer<typeof CampaignIdParamsSchema>;
export type CreateCampaignBody = z.infer<typeof CreateCampaignSchema>;
export type UpdateCampaignBody = z.infer<typeof UpdateCampaignSchema>;
export type ListCampaignsQueryInput = z.infer<typeof ListCampaignsQuerySchema>;
export type ListRecipientsQueryInput = z.infer<typeof ListRecipientsQuerySchema>;

export const campaignIdValidation = withZodValidation({
  params: CampaignIdParamsSchema
});

export const createCampaignValidation = withZodValidation({
  body: CreateCampaignSchema
});

export const updateCampaignValidation = withZodValidation({
  params: CampaignIdParamsSchema,
  body: UpdateCampaignSchema
});

export const listCampaignsValidation = withZodValidation({
  query: ListCampaignsQuerySchema
});

export const listCampaignRecipientsValidation = withZodValidation({
  params: CampaignIdParamsSchema,
  query: ListRecipientsQuerySchema
});

export const createCampaignRouteSchema = {
  tags: ["campaigns"],
  summary: "Create a campaign",
  response: {
    201: {
      type: "object",
      additionalProperties: false,
      required: ["campaign"],
      properties: {
        campaign: campaignDetailSchema
      }
    },
    400: errorResponseSchema,
    403: errorResponseSchema
  }
} as const;

export const listCampaignsRouteSchema = {
  tags: ["campaigns"],
  summary: "List campaigns",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: campaignListItemSchema
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

export const getCampaignRouteSchema = {
  tags: ["campaigns"],
  summary: "Get campaign detail",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["campaign"],
      properties: {
        campaign: campaignDetailSchema
      }
    },
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;

export const updateCampaignRouteSchema = {
  tags: ["campaigns"],
  summary: "Update a draft campaign",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["campaign"],
      properties: {
        campaign: campaignDetailSchema
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema,
    403: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const generateDraftRouteSchema = {
  tags: ["campaigns"],
  summary: "Generate an AI campaign draft",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["campaign"],
      properties: {
        campaign: campaignDetailSchema
      }
    },
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const sendCampaignRouteSchema = {
  tags: ["campaigns"],
  summary: "Send a campaign after human approval",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["campaign"],
      properties: {
        campaign: campaignDetailSchema
      }
    },
    401: errorResponseSchema,
    403: errorResponseSchema,
    404: errorResponseSchema,
    409: errorResponseSchema
  }
} as const;

export const listCampaignRecipientsRouteSchema = {
  tags: ["campaigns"],
  summary: "List campaign recipients",
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: campaignRecipientSchema
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" }
      }
    },
    401: errorResponseSchema,
    404: errorResponseSchema
  }
} as const;
