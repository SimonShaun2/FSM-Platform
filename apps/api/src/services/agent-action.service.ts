import { createHash } from "node:crypto";

import { and, eq, isNull } from "drizzle-orm";

import { agentActions, db, emitEventWithExecutor } from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CanonicalEntityRefV1,
  assertAgentActionApprovable,
  assertAgentActionExecutable,
  assertAgentActionRejectable,
  assertAgentActionTenantScope,
  assertActionTypeMatchesToolName,
  agentActionExpiredError,
  agentActionStaleTargetError,
  AgentToolNameV1Schema,
  assertIdempotencyPayloadMatches,
  evaluateAgentActionPolicyDecision,
  isAgentActionExpired,
  isStaleRecordVersion,
  type AgentToolNameV1
} from "@fsm/types";

import {
  assertActionAllowedForProduct,
  assertPolicyVersion,
  requiresHumanApproval
} from "./agent-action.policy.js";
import { authorizeAgentActionExecution } from "./outbound-policy-engine.service.js";
import { resolveEntityRef } from "./tenant-context.service.js";

const DEFAULT_TTL_MS = 72 * 60 * 60 * 1000;

type SelectExecutor = Pick<typeof db, "select">;
type AgentActionWriteExecutor = Pick<typeof db, "select" | "insert">;
export function agentActionScopedWhere(companyId: string, actionId: string) {
  return and(
    eq(agentActions.id, actionId),
    eq(agentActions.companyId, companyId),
    isNull(agentActions.deletedAt)
  );
}

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
    executionReceipt: row.executionReceipt as Record<string, unknown> | null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function toLifecycleSlice(row: typeof agentActions.$inferSelect) {
  return {
    companyId: row.companyId,
    state: row.state as AgentActionState,
    actionType: row.actionType,
    requiresApproval: row.requiresApproval,
    expiresAt: row.expiresAt
  };
}

async function getActionRow(companyId: string, actionId: string, executor: SelectExecutor = db) {
  const [row] = await executor
    .select()
    .from(agentActions)
    .where(agentActionScopedWhere(companyId, actionId))
    .limit(1);

  if (!row) {
    throw new AppError(ErrorCode.NOT_FOUND, "Agent action not found");
  }

  assertAgentActionTenantScope(companyId, row.companyId);

  return row;
}

async function persistTerminalExpiredState(companyId: string, actionId: string): Promise<void> {
  await db
    .update(agentActions)
    .set({ state: "expired", updatedAt: new Date() })
    .where(agentActionScopedWhere(companyId, actionId));
}

function resolveProposalPolicy(input: CreateAgentActionInput) {
  if (AgentToolNameV1Schema.safeParse(input.actionType).success) {
    assertActionTypeMatchesToolName(input.actionType as AgentToolNameV1, input.parameters);
    return evaluateAgentActionPolicyDecision({
      agentProduct: input.agentProduct,
      actionType: input.actionType,
      actorType: input.actorType,
      policyVersion: input.policyVersion,
      requiresApproval: requiresHumanApproval(input.actionType)
    });
  }

  const needsApproval = requiresHumanApproval(input.actionType);
  return {
    initialState: (needsApproval ? "awaiting_approval" : "policy_evaluated") as AgentActionState,
    requiresApproval: needsApproval,
    allowsAutoExecute: false
  };
}

async function createAgentActionProposalInTransaction(
  tx: AgentActionWriteExecutor,
  input: CreateAgentActionInput
) {
  assertPolicyVersion(input.policyVersion);
  assertActionAllowedForProduct(input.agentProduct, input.actionType, input.actorType);

  const payloadHash = hashPayload({
    actionType: input.actionType,
    parameters: input.parameters,
    target: input.target
  });

  const expiresAt = input.expiresAt ?? new Date(Date.now() + DEFAULT_TTL_MS);
  const policyDecision = resolveProposalPolicy(input);

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
      requiresApproval: policyDecision.requiresApproval,
      state: policyDecision.initialState as AgentActionState,
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
}

export async function createAgentActionProposal(
  input: CreateAgentActionInput,
  existingTx?: AgentActionWriteExecutor
) {
  if (existingTx) {
    return createAgentActionProposalInTransaction(existingTx, input);
  }

  return db.transaction((tx) => createAgentActionProposalInTransaction(tx, input));
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
    const row = await getActionRow(companyId, actionId, tx);

    assertAgentActionApprovable(toLifecycleSlice(row));

    const updatedRows = await tx
      .update(agentActions)
      .set({ state: "approved", reviewerId, updatedAt: new Date() })
      .where(agentActionScopedWhere(companyId, actionId))
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
    const row = await getActionRow(companyId, actionId, tx);

    assertAgentActionRejectable(toLifecycleSlice(row));

    const updatedRows = await tx
      .update(agentActions)
      .set({ state: "cancelled", reviewerId, updatedAt: new Date() })
      .where(agentActionScopedWhere(companyId, actionId))
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

export async function executeAgentAction(companyId: string, actionId: string, actorId: string) {
  let persistExpiredAfterRollback = false;

  try {
    return await db.transaction(async (tx) => {
      const row = await getActionRow(companyId, actionId, tx);

      if (isAgentActionExpired(row.expiresAt)) {
        persistExpiredAfterRollback = true;
        throw agentActionExpiredError();
      }

      assertAgentActionExecutable(toLifecycleSlice(row));

      const target = row.target as CanonicalEntityRefV1;
      const liveRef = await resolveEntityRef(companyId, target.entityType, target.entityId);
      if (isStaleRecordVersion(target.recordVersion, liveRef.recordVersion)) {
        throw agentActionStaleTargetError();
      }

      let authorizationDecision: Awaited<ReturnType<typeof authorizeAgentActionExecution>> | null =
        null;

      if (row.actionType === "message.send_proposed") {
        authorizationDecision = await authorizeAgentActionExecution({
          companyId,
          actorId,
          actorType: "user",
          actionType: row.actionType,
          parameters: row.parameters as Record<string, unknown>,
          target,
          requiresApproval: row.requiresApproval,
          state: row.state as AgentActionState
        });

        if (!authorizationDecision.allowed) {
          throw new AppError(
            authorizationDecision.errorCode ?? ErrorCode.POLICY_DENIED,
            authorizationDecision.reason
          );
        }
      }

      await tx
        .update(agentActions)
        .set({ state: "executing", updatedAt: new Date() })
        .where(agentActionScopedWhere(companyId, actionId));

      const receipt = {
        outcome: "succeeded" as const,
        emittedEventIds: [] as string[],
        note: "No outbound provider send in Batch 2 slice",
        ...(authorizationDecision
          ? {
              authorizationDecision: {
                policyVersion: authorizationDecision.policyVersion,
                reason: authorizationDecision.reason
              }
            }
          : {})
      };

      const updatedRows = await tx
        .update(agentActions)
        .set({
          state: "succeeded",
          executionReceipt: receipt,
          updatedAt: new Date()
        })
        .where(agentActionScopedWhere(companyId, actionId))
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
  } catch (error) {
    if (persistExpiredAfterRollback) {
      await persistTerminalExpiredState(companyId, actionId);
    }
    throw error;
  }
}

export async function getAgentAction(companyId: string, actionId: string) {
  const row = await getActionRow(companyId, actionId);
  return mapRow(row);
}
