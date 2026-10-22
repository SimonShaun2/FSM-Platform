import { describe, expect, it } from "vitest";

import { inquiryIntakeV1Schema, INQUIRY_INTAKE_CONTRACT_VERSION } from "./inquiry-intake.types.js";

describe("inquiry-intake@v0.1 types", () => {
  it("parses a minimal InquiryIntakeV1 fixture", () => {
    const parsed = inquiryIntakeV1Schema.parse({
      contractVersion: INQUIRY_INTAKE_CONTRACT_VERSION,
      id: "11111111-1111-4111-8111-111111111111",
      companyId: "22222222-2222-4222-8222-222222222222",
      channel: "web_form",
      sourceAttribution: "google",
      attributionProvenance: "query_param",
      contact: {
        phone: "+15551234567",
        email: "lead@example.com",
        firstName: "Ada",
        lastName: "Lovelace"
      },
      intentText: "Need AC tune-up next week",
      classifiedIntent: "book",
      serviceability: "in_area",
      consent: {
        smsAppointments: true,
        smsMarketing: false,
        capturedAt: "2026-10-21T12:00:00.000Z",
        captureSurface: "book/contact"
      },
      status: "open",
      linkedBookingRequestId: "33333333-3333-4333-8333-333333333333"
    });

    expect(parsed.channel).toBe("web_form");
    expect(parsed.sourceAttribution).toBe("google");
  });
});
