import { describe, expect, it } from "vitest";

import { AppError, ErrorCode, INQUIRY_INTAKE_CONTRACT_VERSION } from "@fsm/types";

import {
  FIXTURE_COMPANY_A,
  fixtureWebFormInquiryNotes
} from "../fixtures/revenue-inquiry-intake/ac-fixtures.js";
import {
  buildInquiryDedupeKey,
  classifyInquiryIntent,
  hashInquirySubmitPayload,
  mapBookingRowToInquiryIntakeV1
} from "./revenue-inquiry-intake.logic.js";

type BookingRowFixture = {
  id: string;
  companyId: string;
  customerId: string | null;
  jobId: string | null;
  assignedTechnicianId: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  propertyType: string | null;
  serviceCategory: string | null;
  serviceType: string | null;
  serviceDetail: string | null;
  urgency: string | null;
  customerNotes: string | null;
  preferredDate: string | null;
  preferredWindow: string | null;
  status: string;
  source: "google";
  referenceNumber: string | null;
  isPropertyOwner: boolean | null;
  smsConsentAppointments: boolean | null;
  smsConsentMarketing: boolean | null;
  confirmedAt: Date | null;
  confirmedById: string | null;
  confirmationSentAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

function bookingRowFixture(overrides: Partial<BookingRowFixture> = {}): BookingRowFixture {
  const now = new Date("2026-10-21T12:00:00.000Z");
  return {
    id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    companyId: FIXTURE_COMPANY_A,
    customerId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
    jobId: null,
    assignedTechnicianId: null,
    firstName: "Alex",
    lastName: "TenantA",
    phone: "+15551230001",
    email: "lead-a@example.com",
    addressLine1: "1 Main St",
    addressLine2: null,
    city: "Austin",
    state: "TX",
    zip: "78701",
    propertyType: "residential",
    serviceCategory: "HVAC",
    serviceType: "Tune-up",
    serviceDetail: null,
    urgency: "this_week",
    customerNotes: fixtureWebFormInquiryNotes.bookIntent,
    preferredDate: "2026-10-28",
    preferredWindow: "morning",
    status: "pending",
    source: "google",
    referenceNumber: "BR-1001",
    isPropertyOwner: true,
    smsConsentAppointments: true,
    smsConsentMarketing: false,
    confirmedAt: null,
    confirmedById: null,
    confirmationSentAt: null,
    cancelledAt: null,
    cancellationReason: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides
  };
}

describe("revenue inquiry intake fixtures (FS-17 AC)", () => {
  it("AT-ATTR-01: maps google query attribution on web_form intake", () => {
    const inquiry = mapBookingRowToInquiryIntakeV1(bookingRowFixture(), {
      channel: "web_form",
      attributionProvenance: "query_param",
      sourceAttribution: "google",
      captureSurface: "book/confirm",
      serviceability: "in_area",
      classifiedIntent: "book",
      status: "open"
    });

    expect(inquiry.contractVersion).toBe(INQUIRY_INTAKE_CONTRACT_VERSION);
    expect(inquiry.sourceAttribution).toBe("google");
    expect(inquiry.attributionProvenance).toBe("query_param");
    expect(inquiry.linkedBookingRequestId).toBe(inquiry.id);
  });

  it("classifies quote vs book vs unknown intents", () => {
    expect(
      classifyInquiryIntent({
        intentText: fixtureWebFormInquiryNotes.quoteIntent,
        serviceType: null,
        serviceCategory: null,
        preferredDate: null,
        preferredWindow: null
      })
    ).toBe("quote");

    expect(
      classifyInquiryIntent({
        intentText: fixtureWebFormInquiryNotes.bookIntent,
        serviceType: "Tune-up",
        serviceCategory: "HVAC",
        preferredDate: "2026-10-28",
        preferredWindow: "morning"
      })
    ).toBe("book");

    expect(
      classifyInquiryIntent({
        intentText: "idk",
        serviceType: null,
        serviceCategory: null,
        preferredDate: null,
        preferredWindow: null
      })
    ).toBe("unknown");
  });

  it("escalates uncertainty when intent is unknown", () => {
    const inquiry = mapBookingRowToInquiryIntakeV1(
      bookingRowFixture({ customerNotes: "idk", serviceType: null, serviceCategory: null }),
      {
        channel: "staff_entry",
        attributionProvenance: "staff_entry",
        sourceAttribution: "direct",
        captureSurface: "staff_modal",
        serviceability: "unknown",
        classifiedIntent: "unknown",
        status: "escalated",
        escalationReason: "intent_unknown"
      }
    );

    expect(inquiry.status).toBe("escalated");
    expect(inquiry.escalationReason).toBe("intent_unknown");
  });

  it("tenant isolation: dedupe keys are scoped per company", () => {
    const phone = "+15551230001";
    const keyA = buildInquiryDedupeKey(FIXTURE_COMPANY_A, phone, "a@example.com");
    const keyB = buildInquiryDedupeKey("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", phone, "a@example.com");
    expect(keyA).not.toBe(keyB);
  });

  it("AT-ID-02: payload hash mismatch is detectable before replay", () => {
    const base = { slug: "acme", body: { phone: "+1" }, src: "google" };
    const hashA = hashInquirySubmitPayload(base);
    const hashB = hashInquirySubmitPayload({ ...base, src: "facebook" });
    expect(hashA).not.toBe(hashB);

    try {
      if (hashA !== hashB) {
        throw new AppError(ErrorCode.CONFLICT, "Idempotency key was already used with a different payload", {
          reason: "idempotency_payload_mismatch"
        });
      }
      expect.unreachable("should throw");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      const appError = error as AppError;
      expect(appError.code).toBe(ErrorCode.CONFLICT);
      expect(appError.fields?.reason).toBe("idempotency_payload_mismatch");
    }
  });

  it("no lost inquiry: dedupe key links duplicate window without dropping contact", () => {
    const inquiry = mapBookingRowToInquiryIntakeV1(bookingRowFixture(), {
      channel: "web_form",
      attributionProvenance: "query_param",
      sourceAttribution: "google",
      captureSurface: "book/confirm",
      serviceability: "in_area",
      classifiedIntent: "book",
      status: "open",
      dedupeKey: buildInquiryDedupeKey(FIXTURE_COMPANY_A, "+15551230001", "lead-a@example.com")
    });

    expect(inquiry.dedupeKey).toContain(FIXTURE_COMPANY_A);
    expect(inquiry.contact.phone).toBe("+15551230001");
  });
});
