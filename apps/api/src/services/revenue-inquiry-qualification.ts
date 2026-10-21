export interface BookingInquirySnapshot {
  id: string;
  referenceNumber: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  serviceType: string | null;
  serviceCategory: string | null;
  serviceDetail: string | null;
  urgency: string | null;
  preferredDate: string | null;
  preferredWindow: string | null;
  customerNotes: string | null;
  zip: string;
  status: string;
}

export interface InquiryQualificationV1 {
  qualificationScore: number;
  missingInputs: string[];
  qualificationQuestions: string[];
  groundedFacts: string[];
  suggestedNextStep: "request_more_info" | "ready_for_owner_review" | "suggest_confirm_booking";
  pushTowardBooking: boolean;
}

export interface InquiryResponseDraftV1 {
  draftType: "qualification_reply";
  body: string;
  channel: "sms" | "email";
  subject?: string;
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Rule-based qualification for Batch 2 — no live LLM calls, no invented price or availability.
 */
export function qualifyInquiry(inquiry: BookingInquirySnapshot): InquiryQualificationV1 {
  const missingInputs: string[] = [];
  const qualificationQuestions: string[] = [];
  const groundedFacts: string[] = [
    `reference:${inquiry.referenceNumber ?? inquiry.id}`,
    `status:${inquiry.status}`,
    `zip:${inquiry.zip}`
  ];

  if (!hasText(inquiry.email)) {
    missingInputs.push("email");
    qualificationQuestions.push("What is the best email address to reach you?");
  } else {
    groundedFacts.push("email:on_file");
  }

  if (!hasText(inquiry.serviceType) && !hasText(inquiry.serviceCategory)) {
    missingInputs.push("service_type");
    qualificationQuestions.push("Which service do you need help with?");
  } else {
    groundedFacts.push(`service:${inquiry.serviceType ?? inquiry.serviceCategory}`);
  }

  if (!hasText(inquiry.preferredDate)) {
    missingInputs.push("preferred_date");
    qualificationQuestions.push("What day works best for a visit or estimate?");
  }

  if (!hasText(inquiry.preferredWindow)) {
    missingInputs.push("preferred_window");
    qualificationQuestions.push("Do you prefer morning, afternoon, or evening?");
  }

  if (!hasText(inquiry.customerNotes)) {
    missingInputs.push("problem_description");
    qualificationQuestions.push("Can you share a bit more about what you need done?");
  }

  const filledCount = 6 - missingInputs.length;
  const qualificationScore = Math.max(0, Math.min(1, filledCount / 6));

  const urgent = inquiry.urgency === "asap" || inquiry.urgency === "today";
  const pushTowardBooking =
    missingInputs.length === 0 && inquiry.status === "pending" && (urgent || qualificationScore >= 0.85);

  let suggestedNextStep: InquiryQualificationV1["suggestedNextStep"] = "request_more_info";
  if (pushTowardBooking) {
    suggestedNextStep = "suggest_confirm_booking";
  } else if (missingInputs.length <= 1) {
    suggestedNextStep = "ready_for_owner_review";
  }

  return {
    qualificationScore,
    missingInputs,
    qualificationQuestions,
    groundedFacts,
    suggestedNextStep,
    pushTowardBooking
  };
}

export function buildInquiryResponseDraft(
  inquiry: BookingInquirySnapshot,
  qualification: InquiryQualificationV1
): InquiryResponseDraftV1 {
  const name = `${inquiry.firstName} ${inquiry.lastName}`.trim();
  const greeting = `Hi ${inquiry.firstName},`;

  if (qualification.qualificationQuestions.length > 0) {
    const questions = qualification.qualificationQuestions.map((q) => `• ${q}`).join("\n");
    const body = `${greeting} Thanks for reaching out to us${
      inquiry.referenceNumber ? ` (ref ${inquiry.referenceNumber})` : ""
    }. To help you quickly, could you reply with:\n${questions}\n\nWe have not scheduled anything yet — a team member will confirm next steps after we hear back.`;

    return {
      draftType: "qualification_reply",
      body,
      channel: hasText(inquiry.email) ? "email" : "sms",
      ...(hasText(inquiry.email) ? { subject: "Quick questions about your service request" } : {})
    };
  }

  const body = `${greeting} Thanks for your inquiry${
    inquiry.referenceNumber ? ` (${inquiry.referenceNumber})` : ""
  }. We received your request for ${inquiry.serviceType ?? inquiry.serviceCategory ?? "service"} in ${inquiry.zip}. A team member will review and follow up shortly to move toward scheduling — we have not confirmed an appointment yet.`;

  return {
    draftType: "qualification_reply",
    body,
    channel: hasText(inquiry.email) ? "email" : "sms",
    ...(hasText(inquiry.email) ? { subject: "We received your service request" } : {})
  };
}
