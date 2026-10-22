import { INQUIRY_INTAKE_CONTRACT_VERSION } from "@fsm/types";

/** Batch FS-17 acceptance fixtures — deterministic IDs for unit tests. */
export const FIXTURE_COMPANY_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const FIXTURE_COMPANY_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

export const fixtureWebFormInquiryNotes = {
  bookIntent: "Need AC tune-up next Tuesday morning",
  quoteIntent: "How much for a new furnace?",
  vagueIntent: "Hello"
};

export const fixtureInquiryIntakeV1WebGoogle = {
  contractVersion: INQUIRY_INTAKE_CONTRACT_VERSION,
  id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  companyId: FIXTURE_COMPANY_A,
  channel: "web_form" as const,
  sourceAttribution: "google",
  attributionProvenance: "query_param" as const,
  contact: {
    phone: "+15551230001",
    email: "lead-a@example.com",
    firstName: "Alex",
    lastName: "TenantA"
  },
  intentText: fixtureWebFormInquiryNotes.bookIntent,
  classifiedIntent: "book" as const,
  serviceability: "in_area" as const,
  consent: {
    smsAppointments: true,
    smsMarketing: false,
    capturedAt: "2026-10-21T12:00:00.000Z",
    captureSurface: "book/confirm"
  },
  status: "open" as const,
  linkedBookingRequestId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
};
