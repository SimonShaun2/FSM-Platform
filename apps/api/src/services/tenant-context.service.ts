import { and, eq, isNull } from "drizzle-orm";

import {
  assets,
  bookingRequests,
  companies,
  customers,
  db,
  estimates,
  invoices,
  jobs,
  properties
} from "@fsm/db";
import {
  AppError,
  ErrorCode,
  type CanonicalEntityRefV1,
  type CanonicalEntityTypeV1,
  buildRecordVersionV1
} from "@fsm/types";

import { AGENT_POLICY_V1 } from "./agent-action.policy.js";

export interface TenantContextActor {
  id?: string;
  type: "user" | "system" | "ai" | "customer";
  agentProduct?: "revenue" | "scheduling" | "service" | "retention" | "owner";
}

export interface TenantContextV1Response {
  contractVersion: "1.0.0";
  companyId: string;
  timezone: string;
  actor: TenantContextActor;
  policyVersion: string;
  sessionId?: string;
}

interface EntityRow {
  id: string;
  companyId: string;
  updatedAt: Date;
}

async function loadEntityRow(
  companyId: string,
  entityType: CanonicalEntityTypeV1,
  entityId: string
): Promise<EntityRow> {
  switch (entityType) {
    case "customer": {
      const [row] = await db
        .select({
          id: customers.id,
          companyId: customers.companyId,
          updatedAt: customers.updatedAt
        })
        .from(customers)
        .where(
          and(eq(customers.id, entityId), eq(customers.companyId, companyId), isNull(customers.deletedAt))
        )
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Customer not found");
      }
      return row;
    }
    case "property": {
      const [row] = await db
        .select({
          id: properties.id,
          companyId: properties.companyId,
          updatedAt: properties.updatedAt
        })
        .from(properties)
        .where(
          and(eq(properties.id, entityId), eq(properties.companyId, companyId), isNull(properties.deletedAt))
        )
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Property not found");
      }
      return row;
    }
    case "asset": {
      const [row] = await db
        .select({
          id: assets.id,
          companyId: assets.companyId,
          updatedAt: assets.updatedAt
        })
        .from(assets)
        .where(and(eq(assets.id, entityId), eq(assets.companyId, companyId), isNull(assets.deletedAt)))
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Asset not found");
      }
      return row;
    }
    case "job": {
      const [row] = await db
        .select({ id: jobs.id, companyId: jobs.companyId, updatedAt: jobs.updatedAt })
        .from(jobs)
        .where(and(eq(jobs.id, entityId), eq(jobs.companyId, companyId), isNull(jobs.deletedAt)))
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Job not found");
      }
      return row;
    }
    case "estimate": {
      const [row] = await db
        .select({
          id: estimates.id,
          companyId: estimates.companyId,
          updatedAt: estimates.updatedAt
        })
        .from(estimates)
        .where(
          and(eq(estimates.id, entityId), eq(estimates.companyId, companyId), isNull(estimates.deletedAt))
        )
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Estimate not found");
      }
      return row;
    }
    case "invoice": {
      const [row] = await db
        .select({
          id: invoices.id,
          companyId: invoices.companyId,
          updatedAt: invoices.updatedAt
        })
        .from(invoices)
        .where(
          and(eq(invoices.id, entityId), eq(invoices.companyId, companyId), isNull(invoices.deletedAt))
        )
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Invoice not found");
      }
      return row;
    }
    case "booking_request": {
      const [row] = await db
        .select({
          id: bookingRequests.id,
          companyId: bookingRequests.companyId,
          updatedAt: bookingRequests.updatedAt
        })
        .from(bookingRequests)
        .where(
          and(
            eq(bookingRequests.id, entityId),
            eq(bookingRequests.companyId, companyId),
            isNull(bookingRequests.deletedAt)
          )
        )
        .limit(1);
      if (!row) {
        throw new AppError(ErrorCode.NOT_FOUND, "Booking request not found");
      }
      return row;
    }
    default:
      throw new AppError(ErrorCode.VALIDATION_ERROR, "Unsupported entity type");
  }
}

export async function buildTenantContext(
  companyId: string,
  actor: TenantContextActor,
  sessionId?: string
): Promise<TenantContextV1Response> {
  const [company] = await db
    .select({ id: companies.id, timezone: companies.timezone })
    .from(companies)
    .where(and(eq(companies.id, companyId), isNull(companies.deletedAt)))
    .limit(1);

  if (!company) {
    throw new AppError(ErrorCode.NOT_FOUND, "Company not found");
  }

  return {
    contractVersion: "1.0.0",
    companyId,
    timezone: company.timezone,
    actor,
    policyVersion: AGENT_POLICY_V1,
    ...(sessionId ? { sessionId } : {})
  };
}

export async function resolveEntityRef(
  companyId: string,
  entityType: CanonicalEntityTypeV1,
  entityId: string,
  source?: CanonicalEntityRefV1["source"]
): Promise<CanonicalEntityRefV1> {
  const row = await loadEntityRow(companyId, entityType, entityId);
  const recordVersion = buildRecordVersionV1(entityType, entityId, row.updatedAt);

  return {
    contractVersion: "1.0.0",
    entityType,
    entityId,
    companyId,
    observedAt: new Date().toISOString(),
    recordVersion,
    ...(source ? { source } : {})
  };
}

export interface InquiryGraphAnchorV1 {
  bookingRequest: CanonicalEntityRefV1;
  customer?: CanonicalEntityRefV1;
  job?: CanonicalEntityRefV1;
  primarySource: {
    channel: string;
    referenceNumber?: string | null;
    importSessionId?: string;
  };
}

export async function resolveInquiryGraphAnchor(
  companyId: string,
  bookingRequestId: string
): Promise<InquiryGraphAnchorV1> {
  const [inquiry] = await db
    .select()
    .from(bookingRequests)
    .where(
      and(
        eq(bookingRequests.id, bookingRequestId),
        eq(bookingRequests.companyId, companyId),
        isNull(bookingRequests.deletedAt)
      )
    )
    .limit(1);

  if (!inquiry) {
    throw new AppError(ErrorCode.NOT_FOUND, "Booking request not found");
  }

  const bookingSource: CanonicalEntityRefV1["source"] = {
    channel: inquiry.source,
    ...(inquiry.referenceNumber ? { externalId: inquiry.referenceNumber } : {})
  };

  const bookingRequestRef = await resolveEntityRef(
    companyId,
    "booking_request",
    inquiry.id,
    bookingSource
  );

  const anchor: InquiryGraphAnchorV1 = {
    bookingRequest: bookingRequestRef,
    primarySource: {
      channel: inquiry.source,
      referenceNumber: inquiry.referenceNumber
    }
  };

  if (inquiry.customerId) {
    anchor.customer = await resolveEntityRef(companyId, "customer", inquiry.customerId);
  }

  if (inquiry.jobId) {
    anchor.job = await resolveEntityRef(companyId, "job", inquiry.jobId);
  }

  return anchor;
}
