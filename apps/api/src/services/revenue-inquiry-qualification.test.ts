import { describe, expect, it } from "vitest";

import { buildInquiryResponseDraft, qualifyInquiry } from "./revenue-inquiry-qualification.js";

const baseInquiry = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  referenceNumber: "BR-1001",
  firstName: "Jane",
  lastName: "Doe",
  phone: "555-0100",
  email: "jane@example.com",
  serviceType: "deep_clean",
  serviceCategory: "cleaning",
  serviceDetail: null,
  urgency: "this_week",
  preferredDate: "2026-11-01",
  preferredWindow: "morning",
  customerNotes: "Pet-friendly products only",
  zip: "74103",
  status: "pending"
};

describe("qualifyInquiry", () => {
  it("flags missing fields and never invents price or schedule", () => {
    const result = qualifyInquiry({
      ...baseInquiry,
      email: null,
      preferredDate: null,
      customerNotes: null
    });

    expect(result.missingInputs).toContain("email");
    expect(result.qualificationQuestions.length).toBeGreaterThan(0);
    expect(result.suggestedNextStep).toBe("request_more_info");
    expect(result.pushTowardBooking).toBe(false);
  });

  it("suggests booking push when inquiry is complete and urgent", () => {
    const result = qualifyInquiry({
      ...baseInquiry,
      urgency: "asap"
    });

    expect(result.pushTowardBooking).toBe(true);
    expect(result.suggestedNextStep).toBe("suggest_confirm_booking");
  });
});

describe("buildInquiryResponseDraft", () => {
  it("includes honest scheduling language", () => {
    const qualification = qualifyInquiry(baseInquiry);
    const draft = buildInquiryResponseDraft(baseInquiry, qualification);

    expect(draft.body.toLowerCase()).toContain("not");
    expect(draft.body).not.toMatch(/\$\d+/);
  });
});
