import { randomUUID } from "node:crypto";

import { and, desc, eq, isNull } from "drizzle-orm";

import {
  type AdapterOperationKindV1,
  type AdapterOperationStatusV1,
  type AttributionV1,
  type IntegrationOutboxAuditEventType,
  type IntegrationOutboxRetryReceipt,
  IntegrationOutboxRetryReceiptSchema,
  buildIntegrationOutboxRetryReceiptKey
} from "@fsm/types";

import { db } from "./client.js";
import { integrationOutboxAuditEvents, integrationOutboxOperations } from "./schema.js";

export type CreateIntegrationOutboxOperationInput = {
  kind: AdapterOperationKindV1;
  adapterId: string;
  idempotencyKey: string;
  correlationId: string;
  attribution: AttributionV1;
  payload: Record<string, unknown>;
};

type OutboxRow = typeof integrationOutboxOperations.$inferSelect;
type AuditRow = typeof integrationOutboxAuditEvents.$inferSelect;

function mapOperation(row: OutboxRow) {
  return {
    id: row.id,
    companyId: row.companyId,
    kind: row.kind as AdapterOperationKindV1,
    adapterId: row.adapterId,
    idempotencyKey: row.idempotencyKey,
    correlationId: row.correlationId,
    status: row.status as AdapterOperationStatusV1,
    attemptCount: row.attemptCount,
    lastError: row.lastError,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function mapAudit(row: AuditRow) {
  return {
    id: row.id,
    companyId: row.companyId,
    outboxOperationId: row.outboxOperationId,
    eventType: row.eventType as IntegrationOutboxAuditEventType,
    retryReceiptKey: row.retryReceiptKey,
    receipt: (row.receipt ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt
  };
}

async function appendAuditEvent(
  companyId: string,
  outboxOperationId: string,
  eventType:
    | "created"
    | "processing"
    | "retry_receipt"
    | "succeeded"
    | "dead"
    | "duplicate_suppressed",
  receipt: Record<string, unknown>,
  retryReceiptKey?: string
): Promise<AuditRow> {
  const [inserted] = await db
    .insert(integrationOutboxAuditEvents)
    .values({
      companyId,
      outboxOperationId,
      eventType,
      receipt,
      retryReceiptKey: retryReceiptKey ?? null
    })
    .returning();

  if (inserted) {
    return inserted;
  }

  if (retryReceiptKey) {
    const existing = await db.query.integrationOutboxAuditEvents.findFirst({
      where: and(
        eq(integrationOutboxAuditEvents.companyId, companyId),
        eq(integrationOutboxAuditEvents.retryReceiptKey, retryReceiptKey)
      )
    });
    if (existing) {
      return existing;
    }
  }

  throw new Error("INTEGRATION_OUTBOX_AUDIT_INSERT_FAILED");
}

export async function createOrGetIntegrationOutboxOperation(
  companyId: string,
  input: CreateIntegrationOutboxOperationInput
): Promise<{ operation: ReturnType<typeof mapOperation>; created: boolean }> {
  const existing = await db.query.integrationOutboxOperations.findFirst({
    where: and(
      eq(integrationOutboxOperations.companyId, companyId),
      eq(integrationOutboxOperations.kind, input.kind),
      eq(integrationOutboxOperations.idempotencyKey, input.idempotencyKey),
      isNull(integrationOutboxOperations.deletedAt)
    )
  });

  if (existing) {
    await appendAuditEvent(companyId, existing.id, "duplicate_suppressed", {
      schemaVersion: 1,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId
    });
    return { operation: mapOperation(existing), created: false };
  }

  const operationId = randomUUID();
  const [inserted] = await db
    .insert(integrationOutboxOperations)
    .values({
      id: operationId,
      companyId,
      kind: input.kind,
      adapterId: input.adapterId,
      idempotencyKey: input.idempotencyKey,
      correlationId: input.correlationId,
      attribution: input.attribution,
      payload: input.payload,
      status: "pending",
      attemptCount: 0
    })
    .returning();

  if (!inserted) {
    throw new Error("INTEGRATION_OUTBOX_INSERT_FAILED");
  }

  await appendAuditEvent(companyId, inserted.id, "created", {
    schemaVersion: 1,
    kind: input.kind,
    adapterId: input.adapterId,
    idempotencyKey: input.idempotencyKey,
    correlationId: input.correlationId
  });

  return { operation: mapOperation(inserted), created: true };
}

export async function recordIntegrationOutboxRetryReceipt(
  companyId: string,
  outboxOperationId: string,
  receiptInput: IntegrationOutboxRetryReceipt
): Promise<{ auditEvent: ReturnType<typeof mapAudit>; deduplicated: boolean }> {
  const receipt = IntegrationOutboxRetryReceiptSchema.parse(receiptInput);
  const retryReceiptKey = buildIntegrationOutboxRetryReceiptKey(
    receipt.correlationId,
    receipt.attemptNumber
  );

  const operation = await db.query.integrationOutboxOperations.findFirst({
    where: and(
      eq(integrationOutboxOperations.id, outboxOperationId),
      eq(integrationOutboxOperations.companyId, companyId),
      isNull(integrationOutboxOperations.deletedAt)
    )
  });

  if (!operation) {
    throw new Error("INTEGRATION_OUTBOX_NOT_FOUND");
  }

  const existingReceipt = await db.query.integrationOutboxAuditEvents.findFirst({
    where: and(
      eq(integrationOutboxAuditEvents.companyId, companyId),
      eq(integrationOutboxAuditEvents.retryReceiptKey, retryReceiptKey)
    )
  });

  if (existingReceipt) {
    return { auditEvent: mapAudit(existingReceipt), deduplicated: true };
  }

  const [updated] = await db
    .update(integrationOutboxOperations)
    .set({
      status: "processing",
      attemptCount: receipt.attemptNumber,
      updatedAt: new Date()
    })
    .where(
      and(
        eq(integrationOutboxOperations.id, outboxOperationId),
        eq(integrationOutboxOperations.companyId, companyId)
      )
    )
    .returning();

  if (!updated) {
    throw new Error("INTEGRATION_OUTBOX_UPDATE_FAILED");
  }

  try {
    const auditRow = await appendAuditEvent(
      companyId,
      outboxOperationId,
      "retry_receipt",
      receipt,
      retryReceiptKey
    );
    return { auditEvent: mapAudit(auditRow), deduplicated: false };
  } catch (error) {
    const duplicate = await db.query.integrationOutboxAuditEvents.findFirst({
      where: and(
        eq(integrationOutboxAuditEvents.companyId, companyId),
        eq(integrationOutboxAuditEvents.retryReceiptKey, retryReceiptKey)
      )
    });
    if (duplicate) {
      return { auditEvent: mapAudit(duplicate), deduplicated: true };
    }
    throw error;
  }
}

export async function listIntegrationOutboxAuditEvents(
  companyId: string,
  input: { outboxOperationId: string; limit?: number }
): Promise<ReturnType<typeof mapAudit>[]> {
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 100);

  const rows = await db
    .select()
    .from(integrationOutboxAuditEvents)
    .where(
      and(
        eq(integrationOutboxAuditEvents.companyId, companyId),
        eq(integrationOutboxAuditEvents.outboxOperationId, input.outboxOperationId)
      )
    )
    .orderBy(desc(integrationOutboxAuditEvents.createdAt))
    .limit(limit);

  return rows.map(mapAudit);
}

export async function getIntegrationOutboxOperationById(
  companyId: string,
  outboxOperationId: string
): Promise<ReturnType<typeof mapOperation> | null> {
  const row = await db.query.integrationOutboxOperations.findFirst({
    where: and(
      eq(integrationOutboxOperations.id, outboxOperationId),
      eq(integrationOutboxOperations.companyId, companyId),
      isNull(integrationOutboxOperations.deletedAt)
    )
  });

  return row ? mapOperation(row) : null;
}

export async function listIntegrationOutboxOperations(
  companyId: string,
  input: { correlationId?: string; limit?: number }
): Promise<ReturnType<typeof mapOperation>[]> {
  const limit = Math.min(Math.max(input.limit ?? 25, 1), 100);

  const conditions = [
    eq(integrationOutboxOperations.companyId, companyId),
    isNull(integrationOutboxOperations.deletedAt)
  ];

  if (input.correlationId) {
    conditions.push(eq(integrationOutboxOperations.correlationId, input.correlationId));
  }

  const rows = await db
    .select()
    .from(integrationOutboxOperations)
    .where(and(...conditions))
    .orderBy(desc(integrationOutboxOperations.createdAt))
    .limit(limit);

  return rows.map(mapOperation);
}
