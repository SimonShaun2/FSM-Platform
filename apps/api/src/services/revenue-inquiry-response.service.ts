import { and, eq, isNull } from "drizzle-orm";

import { bookingRequests, db, emitEventWithExecutor } from "@fsm/db";
import { AppError, ErrorCode, type ChannelConsentSnapshot, type ConsentScope } from "@fsm/types";

import { createAgentActionProposal } from "./agent-action.service.js";
import {
  buildInquiryResponseDraft,
  qualifyInquiry,
  type BookingInquirySnapshot
} from "./revenue-inquiry-qualification.js";
import { AGENT_POLICY_V1 } from "./agent-action.policy.js";
import { resolveInquiryGraphAnchor } from "./tenant-context.service.js";

export interface InquiryResponseProposalResult {
  anchor: Awaited<ReturnType<typeof resolveInquiryGraphAnchor>>;
  qualification: ReturnType<typeof qualifyInquiry>;
  draft: ReturnType<typeof buildInquiryResponseDraft>;
  proposal: Awaited<ReturnType<typeof createAgentActionProposal>>;
}

function toInquirySnapshot(row: typeof bookingRequests.$inferSelect): BookingInquirySnapshot {
  return {
    id: row.id,
    referenceNumber: row.referenceNumber,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    email: row.email,
    serviceType: row.serviceType,
    serviceCategory: row.serviceCategory,
    serviceDetail: row.serviceDetail,
    urgency: row.urgency,
    preferredDate: row.preferredDate,
    preferredWindow: row.preferredWindow,
    customerNotes: row.customerNotes,
    zip: row.zip,
    status: row.status
  };
}

function buildBookingConsentSnapshot(
  row: typeof bookingRequests.$inferSelect,
  consentScope: ConsentScope
): ChannelConsentSnapshot {
  const consentVersion = row.updatedAt.getTime();

  return {
    consentScope,
    capturedAt: row.updatedAt.toISOString(),
    consentVersion,
    currentConsentVersion: consentVersion,
    appointmentOptIn: row.smsConsentAppointments ?? false,
    marketingOptIn: row.smsConsentMarketing ?? false,
    revokedAt: null
  };
}

export async function createInquiryResponseProposal(
  companyId: string,
  bookingRequestId: string,
  actorId: string,
  idempotencyKey: string
): Promise<InquiryResponseProposalResult> {
  const anchor = await resolveInquiryGraphAnchor(companyId, bookingRequestId);

  return db.transaction(async (tx) => {
    const [row] = await tx
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

    if (!row) {
      throw new AppError(ErrorCode.NOT_FOUND, "Booking request not found");
    }

    const snapshot = toInquirySnapshot(row);
    const qualification = qualifyInquiry(snapshot);
    const draft = buildInquiryResponseDraft(snapshot, qualification);
    const consentSnapshot = buildBookingConsentSnapshot(row, "appointment");

    const proposal = await createAgentActionProposal(
      {
        companyId,
        actorId,
        actorType: "ai",
        agentProduct: "revenue",
        actionType: "message.send_proposed",
        policyVersion: AGENT_POLICY_V1,
        idempotencyKey,
        target: anchor.bookingRequest,
        sourceEventIds: [],
        confidence: qualification.qualificationScore,
        reason: qualification.suggestedNextStep,
        parameters: {
          workflow: "revenue.inquiry_response",
          consentScope: consentSnapshot.consentScope,
          consentSnapshot,
          draftType: draft.draftType,
          channel: draft.channel,
          subject: draft.subject ?? null,
          body: draft.body,
          qualification,
          groundedFacts: qualification.groundedFacts,
          missingInputs: qualification.missingInputs,
          pushTowardBooking: qualification.pushTowardBooking,
          suggestedNextStep: qualification.suggestedNextStep,
          recipient: {
            firstName: snapshot.firstName,
            lastName: snapshot.lastName,
            phone: snapshot.phone,
            email: snapshot.email
          }
        }
      },
      tx
    );

    await emitEventWithExecutor(tx, {
      companyId,
      eventType: "revenue.inquiry_qualified",
      actorId,
      actorType: "ai",
      entityType: "booking_request",
      entityId: bookingRequestId,
      ...(row.customerId ? { customerId: row.customerId } : {}),
      ...(row.jobId ? { jobId: row.jobId } : {}),
      payload: {
        qualificationScore: qualification.qualificationScore,
        missingInputs: qualification.missingInputs,
        suggestedNextStep: qualification.suggestedNextStep,
        agentActionId: proposal.id
      },
      summary: "Revenue agent qualified inquiry for owner review"
    });

    return { anchor, qualification, draft, proposal };
  });
}
