import { and, eq, inArray } from "drizzle-orm";

import { activityEvents, db } from "@fsm/db";
import type { OperatorInboxItem, OperatorInboxProvenanceEvent } from "@fsm/types";
import { AppError, ErrorCode } from "@fsm/types";

import { getAgentAction, listAgentActions, type AgentActionState } from "./agent-action.service.js";
import { type AgentActionRowView, toOperatorInboxItem } from "./operator-inbox.mapper.js";

function mapToRowView(action: Awaited<ReturnType<typeof getAgentAction>>): AgentActionRowView {
  return {
    id: action.id,
    agentProduct: action.agentProduct,
    actionType: action.actionType,
    parameters: action.parameters,
    approvedParameters: action.approvedParameters ?? null,
    sourceEventIds: action.sourceEventIds,
    policyVersion: action.policyVersion,
    requiresApproval: action.requiresApproval,
    state: action.state,
    confidence: action.confidence?.toString() ?? null,
    reason: action.reason,
    expiresAt: action.expiresAt,
    reviewerId: action.reviewerId,
    executionReceipt: action.executionReceipt,
    createdAt: action.createdAt
  };
}

async function loadProvenanceEvents(
  companyId: string,
  eventIds: string[]
): Promise<OperatorInboxProvenanceEvent[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: activityEvents.id,
      eventType: activityEvents.eventType,
      summary: activityEvents.summary,
      occurredAt: activityEvents.occurredAt
    })
    .from(activityEvents)
    .where(and(eq(activityEvents.companyId, companyId), inArray(activityEvents.id, eventIds)));

  return rows.map((row) => ({
    id: row.id,
    eventType: row.eventType,
    summary: row.summary,
    createdAt: row.occurredAt.toISOString()
  }));
}

export async function listOperatorInbox(
  companyId: string,
  filters: { state?: AgentActionState; agentProduct?: string }
): Promise<OperatorInboxItem[]> {
  const actions = await listAgentActions(companyId, filters);
  const allEventIds = Array.from(new Set(actions.flatMap((action) => action.sourceEventIds)));
  const events = await loadProvenanceEvents(companyId, allEventIds);
  const eventsById = new Map(events.map((event) => [event.id, event]));

  return actions.map((action) => {
    const row = mapToRowView(action);
    const sourceEvents = row.sourceEventIds
      .map((eventId) => eventsById.get(eventId))
      .filter((event): event is OperatorInboxProvenanceEvent => Boolean(event));

    return toOperatorInboxItem(row, sourceEvents);
  });
}

export async function getOperatorInboxItem(companyId: string, actionId: string): Promise<OperatorInboxItem> {
  const action = await getAgentAction(companyId, actionId);
  const row = mapToRowView(action);
  const sourceEvents = await loadProvenanceEvents(companyId, row.sourceEventIds);
  return toOperatorInboxItem(row, sourceEvents);
}

export async function getJobTimelineForProvenance(
  companyId: string,
  jobId: string,
  eventIds: string[]
): Promise<OperatorInboxProvenanceEvent[]> {
  if (eventIds.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: activityEvents.id,
      eventType: activityEvents.eventType,
      summary: activityEvents.summary,
      occurredAt: activityEvents.occurredAt
    })
    .from(activityEvents)
    .where(
      and(eq(activityEvents.companyId, companyId), eq(activityEvents.jobId, jobId), inArray(activityEvents.id, eventIds))
    );

  if (rows.length !== eventIds.length) {
    throw new AppError(ErrorCode.FORBIDDEN, "One or more provenance events are not visible for this job");
  }

  return rows.map((row) => ({
    id: row.id,
    eventType: row.eventType,
    summary: row.summary,
    createdAt: row.occurredAt.toISOString()
  }));
}
