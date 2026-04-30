import { z } from "zod";

import { withZodValidation } from "../shared/validation.js";

const uuidSchema = z.string().uuid();

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

const messageLogSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "id",
    "customerId",
    "campaignId",
    "campaignName",
    "channel",
    "direction",
    "toAddress",
    "fromAddress",
    "subject",
    "body",
    "providerStatus",
    "sentAt",
    "deliveredAt",
    "failedAt",
    "failureReason",
    "createdAt"
  ],
  properties: {
    id: { type: "string" },
    customerId: nullableStringSchema,
    campaignId: nullableStringSchema,
    campaignName: nullableStringSchema,
    channel: { type: "string" },
    direction: { type: "string" },
    toAddress: { type: "string" },
    fromAddress: nullableStringSchema,
    subject: nullableStringSchema,
    body: { type: "string" },
    providerStatus: nullableStringSchema,
    sentAt: nullableDateTimeSchema,
    deliveredAt: nullableDateTimeSchema,
    failedAt: nullableDateTimeSchema,
    failureReason: nullableStringSchema,
    createdAt: { type: "string", format: "date-time" }
  }
} as const;

export const ListMessageLogsQuerySchema = z
  .object({
    customerId: uuidSchema,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export const ListMessageConversationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25)
  })
  .strict();

export type ListMessageLogsQueryInput = z.infer<typeof ListMessageLogsQuerySchema>;
export type ListMessageConversationsQueryInput = z.infer<typeof ListMessageConversationsQuerySchema>;

export const listMessageLogsValidation = withZodValidation({
  query: ListMessageLogsQuerySchema
});

export const listMessageConversationsValidation = withZodValidation({
  query: ListMessageConversationsQuerySchema
});

export const listMessageLogsRouteSchema = {
  tags: ["message-logs"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages"],
      properties: {
        data: {
          type: "array",
          items: messageLogSchema
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

export const listMessageConversationsRouteSchema = {
  tags: ["message-logs"],
  response: {
    200: {
      type: "object",
      additionalProperties: false,
      required: ["data", "total", "page", "limit", "totalPages", "totalUnread"],
      properties: {
        data: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: [
              "customerId",
              "firstName",
              "lastName",
              "displayName",
              "phone",
              "lastMessagePreview",
              "lastMessageAt",
              "lastDirection",
              "unreadCount"
            ],
            properties: {
              customerId: { type: "string" },
              firstName: { type: "string" },
              lastName: { type: "string" },
              displayName: nullableStringSchema,
              phone: nullableStringSchema,
              lastMessagePreview: { type: "string" },
              lastMessageAt: { type: "string", format: "date-time" },
              lastDirection: { type: "string" },
              unreadCount: { type: "integer" }
            }
          }
        },
        total: { type: "integer" },
        page: { type: "integer" },
        limit: { type: "integer" },
        totalPages: { type: "integer" },
        totalUnread: { type: "integer" }
      }
    },
    400: errorResponseSchema,
    401: errorResponseSchema
  }
} as const;
