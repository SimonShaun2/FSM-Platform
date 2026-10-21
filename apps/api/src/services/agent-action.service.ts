import { createHash } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { agentActions, db, emitEventWithExecutor } from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CanonicalEntityRefV1,
  assertIdempotencyPayloadMatches,
  isStaleRecordVersion
} from "@fsm/types";

import {
  assertActionAllowedForProduct,
  assertPolicyVersion,
  requiresHumanApproval
} from "./agent-action.policy.js";
import { resolveEntityRef } from "./tenant-context.service.js";

const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000;

export type AgentActionState =
  | "proposed"
  | "policy_evaluated"
  | "awaiting_approval"
  | "approved"
  | "executing"
  | "succeeded"
  | "failed"
  | "expired"
  | "cancelled"
  | "escalated";

export interface CreateAgentActionInput {
  companyId: string;
  actorId: string;
  actorType: "user" | "system" | "ai" | "customer";
  agentProduct: "revenue" | "scheduling" | "service" | "retention" | "owner";
  actionType: string;
  parameters: Record<string, unknown>;
  target: CanonicalEntityRefV1;
  idempotencyKey: string;
  policyVersion: string;
  sourceEventIds?: string[];
  confidence?: number;
  reason?: string;
  expiresAt?: Date;
}

function hashPayload(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function mapRow(row: typeof agentActions.$inferSelect) {
  return {
    id: row.id,
    companyId: row.companyId,
    agentProduct: row.agentProduct,
    actionType: row.actionType,
    parameters: row.parameters as Record<string, unknown>,
    target: row.target as CanonicalEntityRefV1,
    sourceEventIds: row.sourceEventIds,
    idempotencyKey: row.idempotencyKey,
    policyVersion: row.policyVersion,
    requiresApproval: row.requiresApproval,
    state: row.state as AgentActionState,
    confidence: row.confidence,
    reason: row.reason,
    expiresAt: row.expiresAt.toISOString(),
    reviewerId: row.reviewerId,
    approvedParameters: (row.approvedParameters as Record<string, unknown> | null) ?? null,
    executionReceipt: row.executionReceipt as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

async function getActionRow(companyId: string, actionId: string) {
  const [row] = await db
    .select()
    .from(agentActions)
    .where(
      and(eq(agentActions.id, actionId), eq(agentActions.companyId, companyId), isNull(agentActions.deletedAt))
    )
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent action not found");
  }

  return row;
}

export async function createAgentActionProposal(input: CreateAgentActionInput) {
  assertPolicyVersion(input.policyVersion);
  assertActionAllowedForProduct(input.agentProduct, input.actionType, input.actorType);

  const payloadHash = hashPayload({
    actionType: input.actionType,
    parameters: input.parameters,
    target: input.target
  });

  const expiresAt = input.expiresAt ?? new Date(Date.now() + DEFAULT_TTL_MS);
  const needsApproval = requiresHumanApproval(input.actionType);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(agentActions)
      .where(
        and(
          eq(agentActions.companyId, input.companyId),
          eq(agentActions.idempotencyKey, input.idempotencyKey),
          isNull(agentActions.deletedAt)
        )
      )
      .limit(1);

    if (existing) {
      assertIdempotencyPayloadMatches(existing.payloadHash, {
        companyId: input.companyId,
        idempotencyKey: input.idempotencyKey,
        payloadFingerprint: payloadHash
      });
      return mapRow(existing);
    }

    const initialState: AgentActionState = needsApproval ? "awaiting_approval" : "policy_evaluated";

    const insertedRows = await tx
      .insert(agentActions)
      .values({
        companyId: input.companyId,
        agentProduct: input.agentProduct,
        actionType: input.actionType,
        parameters: input.parameters,
        target: input.target,
        sourceEventIds: input.sourceEventIds ?? [],
        idempotencyKey: input.idempotencyKey,
        payloadHash,
        policyVersion: input.policyVersion,
        requiresApproval: needsApproval,
        state: initialState,
        confidence: input.confidence?.toString(),
        reason: input.reason,
        expiresAt
      })
      .returning();

    const inserted = insertedRows[0];
    if (!inserted) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to create agent action");
    }

    await emitEventWithExecutor(tx, {
      companyId: input.companyId,
      eventType: "agent.proposal_created",
      actorId: input.actorId,
      actorType: input.actorType,
      entityType: "agent_action",
      entityId: inserted.id,
      payload: {
        actionType: input.actionType,
        agentProduct: input.agentProduct,
        state: inserted.state
      },
      summary: `Agent proposal created (${input.actionType})`
    });

    return mapRow(inserted);
  });
}

export async function listAgentActions(
  companyId: string,
  filters: { state?: AgentActionState; agentProduct?: string }
) {
  const rows = await db
    .select()
    .from(agentActions)
    .where(and(eq(agentActions.companyId, companyId), isNull(agentActions.deletedAt)));

  return rows
    .filter((row) => (filters.state ? row.state === filters.state : true))
    .filter((row) => (filters.agentProduct ? row.agentProduct === filters.agentProduct : true))
    .map(mapRow);
}

export async function approveAgentAction(companyId: string, actionId: string, reviewerId: string) {
  return db.transaction(async (tx) => {
    const row = await getActionRow(companyId, actionId);

    if (row.state !== "awaiting_approval" && row.state !== "policy_evaluated") {
      throw new AppError(ErrorCode.CONFLICT, "Agent action is not awaiting approval");
    }

    if (row.expiresAt.getTime() < Date.now()) {
      await tx
        .update(agentActions)
        .set({ state: "expired", updatedAt: new Date() })
        .where(eq(agentActions.id, actionId));
      throw new AppError(ErrorCode.CONFLICT, "Agent action has expired");
    }

    const approvedParameters = (row.parameters as Record<string, unknown>) ?? {};

    const updatedRows = await tx
      .update(agentActions)
      .set({
        state: "approved",
        reviewerId,
        approvedParameters,
        updatedAt: new Date()
      })
      .where(eq(agentActions.id, actionId))
      .returning();

    const updated = updatedRows[0];
    if (!updated) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to approve agent action");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "agent.proposal_approved",
      actorId: reviewerId,
      actorType: "user",
      entityType: "agent_action",
      entityId: actionId,
      summary: "Agent proposal approved"
    });

    return mapRow(updated);
  });
}

export async function rejectAgentAction(companyId: string, actionId: string, reviewerId: string) {
  return db.transaction(async (tx) => {
    const row = await getActionRow(companyId, actionId);

    if (row.state !== "awaiting_approval" && row.state !== "policy_evaluated") {
      throw new AppError(ErrorCode.CONFLICT, "Agent action is not awaiting approval");
    }

    const updatedRows = await tx
      .update(agentActions)
      .set({ state: "cancelled", reviewerId, updatedAt: new Date() })
      .where(eq(agentActions.id, actionId))
      .returning();

    const updated = updatedRows[0];
    if (!updated) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to reject agent action");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "agent.proposal_rejected",
      actorId: reviewerId,
      actorType: "user",
      entityType: "agent_action",
      entityId: actionId,
      summary: "Agent proposal rejected"
    });

    return mapRow(updated);
  });
}

function resolveExecutableParameters(row: typeof agentActions.$inferSelect): Record<string, unknown> {
  if (row.requiresApproval) {
    const approved = row.approvedParameters as Record<string, unknown> | null;
    if (!approved) {
      throw new AppError(ErrorCode.CONFLICT, "Approved parameters are missing");
    }

    return approved;
  }

  return (row.parameters as Record<string, unknown>) ?? {};
}

export async function editAgentActionParameters(
  companyId: string,
  actionId: string,
  editorId: string,
  patch: { channel?: "sms" | "email"; subject?: string | null; body: string }
) {
  return db.transaction(async (tx) => {
    const row = await getActionRow(companyId, actionId);

    if (row.state !== "awaiting_approval") {
      throw new AppError(ErrorCode.CONFLICT, "Only awaiting-approval actions can be edited");
    }

    if (row.actionType !== "message.send_proposed" && row.actionType !== "message.draft") {
      throw new AppError(ErrorCode.VALIDATION_ERROR, "This action type cannot be edited");
    }

    const current = (row.parameters as Record<string, unknown>) ?? {};
    const nextParameters: Record<string, unknown> = {
      ...current,
      body: patch.body,
      ...(patch.channel ? { channel: patch.channel } : {}),
      ...(patch.subject !== undefined ? { subject: patch.subject } : {})
    };

    const payloadHash = hashPayload({
      actionType: row.actionType,
      parameters: nextParameters,
      target: row.target as CanonicalEntityRefV1
    });

    const updatedRows = await tx
      .update(agentActions)
      .set({
        parameters: nextParameters,
        payloadHash,
        approvedParameters: null,
        updatedAt: new Date()
      })
      .where(eq(agentActions.id, actionId))
      .returning();

    const updated = updatedRows[0];
    if (!updated) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to edit agent action");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "agent.proposal_edited",
      actorId: editorId,
      actorType: "user",
      entityType: "agent_action",
      entityId: actionId,
      payload: {
        actionType: row.actionType,
        channel: patch.channel ?? current.channel
      },
      summary: "Agent proposal edited by operator"
    });

    return mapRow(updated);
  });
}

export async function executeAgentAction(companyId: string, actionId: string, actorId: string) {
  return db.transaction(async (tx) => {
    const row = await getActionRow(companyId, actionId);

    if (row.expiresAt.getTime() < Date.now()) {
      await tx
        .update(agentActions)
        .set({ state: "expired", updatedAt: new Date() })
        .where(eq(agentActions.id, actionId));
      throw new AppError(ErrorCode.CONFLICT, "Agent action has expired");
    }

    if (row.requiresApproval && row.state !== "approved") {
      throw new AppError(ErrorCode.CONFLICT, "Agent action requires approval before execution");
    }

    if (!row.requiresApproval && row.state !== "policy_evaluated" && row.state !== "approved") {
      throw new AppError(ErrorCode.CONFLICT, "Agent action is not executable");
    }

    const target = row.target as CanonicalEntityRefV1;
    const liveRef = await resolveEntityRef(companyId, target.entityType, target.entityId);
    if (isStaleRecordVersion(target.recordVersion, liveRef.recordVersion)) {
      throw new AppError(ErrorCode.CONFLICT, "Target recordVersion is stale; re-resolve context");
    }

    const executableParameters = resolveExecutableParameters(row);

    await tx.update(agentActions).set({ state: "executing", updatedAt: new Date() }).where(eq(agentActions.id, actionId));

    const receipt = {
      outcome: "succeeded" as const,
      emittedEventIds: [] as string[],
      note: "No outbound provider send in Batch 4 slice",
      approvedParameters: executableParameters,
      approvedParametersHash: hashPayload({
        actionType: row.actionType,
        parameters: executableParameters,
        target: row.target as CanonicalEntityRefV1
      }),
      executedAt: new Date().toISOString()
    };

    const updatedRows = await tx
      .update(agentActions)
      .set({
        state: "succeeded",
        executionReceipt: receipt,
        updatedAt: new Date()
      })
      .where(eq(agentActions.id, actionId))
      .returning();

    const updated = updatedRows[0];
    if (!updated) {
      throw new AppError(ErrorCode.INTERNAL_ERROR, "Failed to execute agent action");
    }

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "agent.execution_succeeded",
      actorId,
      actorType: "user",
      entityType: "agent_action",
      entityId: actionId,
      payload: {
        actionType: row.actionType,
        receipt
      },
      summary: `Agent action executed (${row.actionType})`
    });

    return mapRow(updated);
  });
}

export async function getAgentAction(companyId: string, actionId: string) {
  const row = await getActionRow(companyId, actionId);
  return mapRow(row);
}
