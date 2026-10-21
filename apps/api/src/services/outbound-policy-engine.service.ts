import { and, eq, isNull } from "drizzle-orm";

import { bookingRequests, customers, db } from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CanonicalEntityRefV1,
  type ChannelConsentSnapshot,
  type ConsentScope,
  type OutboundAuthorizationDecision,
  OUTBOUND_AUTHORIZATION_POLICY_V1,
  evaluateOutboundAuthorization
} from "@fsm/types";

import type { AgentActionState } from "./agent-action.service.js";

export interface AuthorizeAgentActionExecutionInput {
  companyId: string;
  actorId: string;
  actorType: "user" | "system" | "ai" | "customer";
  assertedCompanyId?: string;
  actionType: string;
  parameters: Record<string, unknown>;
  target: CanonicalEntityRefV1;
  requiresApproval: boolean;
  state: AgentActionState;
}

function parseConsentSnapshot(value: unknown): ChannelConsentSnapshot | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    typeof record.capturedAt !== "string" ||
    typeof record.consentVersion !== "number" ||
    typeof record.currentConsentVersion !== "number" ||
    (record.consentScope !== "appointment" && record.consentScope !== "marketing")
  ) {
    return null;
  }

  return {
    consentScope: record.consentScope as ConsentScope,
    capturedAt: record.capturedAt,
    consentVersion: record.consentVersion,
    appointmentOptIn: Boolean(record.appointmentOptIn),
    marketingOptIn: Boolean(record.marketingOptIn),
    revokedAt: typeof record.revokedAt === "string" ? record.revokedAt : null,
    currentConsentVersion: record.currentConsentVersion
  };
}

async function loadConsentSnapshotForTarget(
  companyId: string,
  target: CanonicalEntityRefV1,
  consentScope: ConsentScope
): Promise<ChannelConsentSnapshot> {
  if (target.entityType === "booking_request") {
    const [row] = await db
      .select()
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.id, target.entityId),
          eq(bookingRequests.companyId, companyId),
          isNull(bookingRequests.deletedAt)
        )
      )
      .limit(1);

    if (!row) {
      throw new AppError(ErrorCode.NOT_FOUND, "Booking request not found for consent evaluation");
    }

    const capturedAt = row.createdAt.toISOString();
    return {
      consentScope,
      capturedAt,
      consentVersion: 1,
      currentConsentVersion: 1,
      appointmentOptIn: row.smsConsentAppointments ?? false,
      marketingOptIn: row.smsConsentMarketing ?? false,
      revokedAt: null
    };
  }

  if (target.entityType === "customer") {
    const [row] = await db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, target.entityId), eq(customers.companyId, companyId), isNull(customers.deletedAt))
      )
      .limit(1);

    if (!row) {
      throw new AppError(ErrorCode.NOT_FOUND, "Customer not found for consent evaluation");
    }

    const capturedAt = row.updatedAt.toISOString();
    return {
      consentScope,
      capturedAt,
      consentVersion: 1,
      currentConsentVersion: 1,
      appointmentOptIn: !row.doNotContact,
      marketingOptIn: !row.doNotContact,
      revokedAt: row.doNotContact ? capturedAt : null
    };
  }

  throw new AppError(ErrorCode.VALIDATION_ERROR, "Unsupported target for outbound consent evaluation");
}

async function loadCustomerChannelPrefs(
  companyId: string,
  target: CanonicalEntityRefV1
): Promise<{ doNotContact: boolean; prefersSms: boolean; prefersEmail: boolean }> {
  let customerId: string | null = null;

  if (target.entityType === "customer") {
    customerId = target.entityId;
  }

  if (target.entityType === "booking_request") {
    const [row] = await db
      .select()
      .from(bookingRequests)
      .where(
        and(
          eq(bookingRequests.id, target.entityId),
          eq(bookingRequests.companyId, companyId),
          isNull(bookingRequests.deletedAt)
        )
      )
      .limit(1);
    customerId = row?.customerId ?? null;
  }

  if (!customerId) {
    return { doNotContact: false, prefersSms: true, prefersEmail: true };
  }

  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(eq(customers.id, customerId), eq(customers.companyId, companyId), isNull(customers.deletedAt))
    )
    .limit(1);

  if (!customer) {
    return { doNotContact: false, prefersSms: true, prefersEmail: true };
  }

  return {
    doNotContact: customer.doNotContact ?? false,
    prefersSms: customer.prefersSms ?? true,
    prefersEmail: customer.prefersEmail ?? true
  };
}

function resolveConsentScope(parameters: Record<string, unknown>): ConsentScope {
  if (parameters.consentScope === "marketing") {
    return "marketing";
  }
  if (parameters.consentScope === "appointment") {
    return "appointment";
  }
  if (parameters.workflow === "revenue.inquiry_response") {
    return "appointment";
  }
  return "marketing";
}

export async function authorizeAgentActionExecution(
  input: AuthorizeAgentActionExecutionInput
): Promise<OutboundAuthorizationDecision> {
  const channel = input.parameters.channel === "email" ? "email" : "sms";
  const consentScope = resolveConsentScope(input.parameters);
  const embedded = parseConsentSnapshot(input.parameters.consentSnapshot);
  const consent =
    embedded ??
    (await loadConsentSnapshotForTarget(input.companyId, input.target, consentScope));
  const customer = await loadCustomerChannelPrefs(input.companyId, input.target);

  const decision = evaluateOutboundAuthorization({
    policyVersion: OUTBOUND_AUTHORIZATION_POLICY_V1,
    kind: "agent_action_execute",
    resourceCompanyId: input.target.companyId,
    actor: {
      companyId: input.companyId,
      actorId: input.actorId,
      actorType: input.actorType,
      ...(input.assertedCompanyId !== undefined
        ? { assertedCompanyId: input.assertedCompanyId }
        : {})
    },
    channel,
    actionType: input.actionType,
    consent,
    customer,
    approval: {
      required: input.requiresApproval,
      approved: input.state === "approved"
    }
  });

  return decision;
}

export function assertOutboundAuthorizationAllowed(decision: OutboundAuthorizationDecision): void {
  if (decision.allowed) {
    return;
  }

  throw new AppError(decision.errorCode ?? ErrorCode.POLICY_DENIED, decision.reason);
}
