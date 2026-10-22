import { z } from "zod";

import { UuidSchema } from "../../agent-control-plane/v1/zod-shared.js";

import { AttributionV1Schema } from "./attribution.js";

export const AdapterOperationKindV1Schema = z.enum([
  "csv_import",
  "public_booking",
  "sms_outbound",
  "email_outbound",
  "stripe_connect"
]);

export type AdapterOperationKindV1 = z.infer<typeof AdapterOperationKindV1Schema>;

export const AdapterOperationStatusV1Schema = z.enum(["pending", "processing", "succeeded", "dead"]);

export type AdapterOperationStatusV1 = z.infer<typeof AdapterOperationStatusV1Schema>;

export const AdapterOperationV1Schema = z
  .object({
    schemaVersion: z.literal(1),
    companyId: UuidSchema,
    kind: AdapterOperationKindV1Schema,
    adapterId: z.string().min(1).max(64),
    idempotencyKey: z.string().min(1).max(255),
    correlationId: UuidSchema,
    attribution: AttributionV1Schema,
    payload: z.record(z.string(), z.unknown()),
    status: AdapterOperationStatusV1Schema,
    attemptCount: z.number().int().min(0),
    lastError: z.string().max(2000).nullable().optional()
  })
  .strict();

export type AdapterOperationV1 = z.infer<typeof AdapterOperationV1Schema>;
