import { createHash } from "node:crypto";

import {
  INQUIRY_INTAKE_CONTRACT_VERSION,
  type ClassifiedInquiryIntent,
  type InquiryAttributionProvenance,
  type InquiryIntakeChannel,
  type InquiryIntakeStatus,
  type InquiryIntakeV1,
  type InquiryServiceability
} from "@fsm/types";

export interface InquiryBookingRow {
  id: string;
  companyId: string;
  customerId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  serviceCategory: string | null;
  serviceType: string | null;
  customerNotes: string | null;
  preferredDate: string | null;
  preferredWindow: string | null;
  source: string;
  smsConsentAppointments: boolean | null;
  smsConsentMarketing: boolean | null;
  createdAt: Date;
}

export interface IntakeBuildContext {
  channel: InquiryIntakeChannel;
  attributionProvenance: InquiryAttributionProvenance;
  sourceAttribution: string | null;
  captureSurface: string;
  serviceability: InquiryServiceability;
  classifiedIntent: ClassifiedInquiryIntent;
  status: InquiryIntakeStatus;
  dedupeKey?: string;
  escalationReason?: string;
  linkedCustomerId?: string;
}

export function hashInquirySubmitPayload(payload: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export function buildInquiryDedupeKey(companyId: string, phone: string, email: string | null): string {
  const normalizedPhone = phone.replace(/\D/gu, "");
  const normalizedEmail = email?.trim().toLowerCase() ?? "";
  return `dedupe:${companyId}:${normalizedPhone}:${normalizedEmail}`;
}

export function classifyInquiryIntent(input: {
  intentText: string;
  serviceType?: string | null;
  serviceCategory?: string | null;
  preferredDate?: string | null;
  preferredWindow?: string | null;
}): ClassifiedInquiryIntent {
  const text = input.intentText.trim().toLowerCase();
  const hasService = Boolean(input.serviceType?.trim() || input.serviceCategory?.trim());
  const hasSchedule = Boolean(
    input.preferredDate?.trim() || (input.preferredWindow && input.preferredWindow !== "first_available")
  );

  if (/\?|how much|pricing|cost|quote|estimate/u.test(text) && !hasSchedule) {
    return "quote";
  }

  if (/^(hi|hello|hey)\b/u.test(text) && text.length < 40 && !hasService) {
    return "question";
  }

  if (hasService && hasSchedule) {
    return "book";
  }

  if (hasService) {
    return "quote";
  }

  if (text.length >= 12) {
    return "question";
  }

  return "unknown";
}

export function resolveAmbiguityEscalation(
  classifiedIntent: ClassifiedInquiryIntent,
  priorIntent: ClassifiedInquiryIntent | null
): { status: InquiryIntakeStatus; escalationReason?: string } {
  if (classifiedIntent === "unknown") {
    return { status: "escalated", escalationReason: "intent_unknown" };
  }

  if (priorIntent && priorIntent !== classifiedIntent) {
    return {
      status: "escalated",
      escalationReason: `dedupe_intent_conflict:${priorIntent}->${classifiedIntent}`
    };
  }

  return { status: "open" };
}

export function mapBookingRowToInquiryIntakeV1(row: InquiryBookingRow, context: IntakeBuildContext): InquiryIntakeV1 {
  const capturedAt = row.createdAt.toISOString();
  const inquiry: InquiryIntakeV1 = {
    contractVersion: INQUIRY_INTAKE_CONTRACT_VERSION,
    id: row.id,
    companyId: row.companyId,
    channel: context.channel,
    sourceAttribution: context.sourceAttribution,
    attributionProvenance: context.attributionProvenance,
    contact: {
      phone: row.phone,
      firstName: row.firstName,
      lastName: row.lastName,
      ...(row.email ? { email: row.email } : {})
    },
    property: {
      addressLine1: row.addressLine1,
      city: row.city,
      state: row.state,
      zip: row.zip
    },
    intentText: row.customerNotes?.trim() || "Inquiry received",
    classifiedIntent: context.classifiedIntent,
    serviceability: context.serviceability,
    consent: {
      smsAppointments: row.smsConsentAppointments ?? false,
      smsMarketing: row.smsConsentMarketing ?? false,
      capturedAt,
      captureSurface: context.captureSurface
    },
    status: context.status,
    linkedBookingRequestId: row.id,
    ...(context.linkedCustomerId ? { linkedCustomerId: context.linkedCustomerId } : {}),
    ...(context.dedupeKey ? { dedupeKey: context.dedupeKey } : {}),
    ...(context.escalationReason ? { escalationReason: context.escalationReason } : {})
  };

  return inquiry;
}

export function classifyFromBookingRow(row: InquiryBookingRow): ClassifiedInquiryIntent {
  return classifyInquiryIntent({
    intentText: row.customerNotes ?? "",
    serviceType: row.serviceType,
    serviceCategory: row.serviceCategory,
    preferredDate: row.preferredDate,
    preferredWindow: row.preferredWindow
  });
}
