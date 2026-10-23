import { describe, expect, it } from "vitest";

import { EMAIL_TEMPLATE_IDS, renderTransactionalEmail, resolveOutboundEmailFromAddress } from "./email-templates.js";

describe("renderTransactionalEmail", () => {
  it("renders booking confirmation with stable template id", () => {
    const rendered = renderTransactionalEmail(EMAIL_TEMPLATE_IDS.bookingConfirmation, {
      firstName: "Sam",
      companyName: "Acme HVAC",
      referenceNumber: "BK-1",
      scheduledLabel: "Apr 30, 8:00 AM"
    });

    expect(rendered.templateId).toBe("booking.confirmation");
    expect(rendered.subject).toContain("BK-1");
    expect(rendered.html).toContain("Acme HVAC");
    expect(rendered.html).toContain("Apr 30");
  });

  it("renders VIP lifecycle templates with Figma-aligned subjects", () => {
    const welcome = renderTransactionalEmail(EMAIL_TEMPLATE_IDS.vipMembershipWelcome, {
      firstName: "Sam",
      companyName: "Juniper Home Co.",
      planName: "VIP Plus",
      portalUrl: "https://example.test/vip"
    });
    expect(welcome.subject).toBe("Welcome to VIP Plus");

    const renewal = renderTransactionalEmail(EMAIL_TEMPLATE_IDS.vipMembershipRenewal, {
      firstName: "Sam",
      companyName: "Juniper Home Co.",
      planName: "VIP Plus",
      amount: "29.00",
      renewalDateLabel: "Oct 23, 2026"
    });
    expect(renewal.subject).toBe("Your VIP Plus membership renewed");

    const dunning = renderTransactionalEmail(EMAIL_TEMPLATE_IDS.vipMembershipPaymentFailed, {
      firstName: "Sam",
      companyName: "Juniper Home Co.",
      planName: "VIP Plus",
      amount: "29.00",
      paymentUrl: "https://pay.example.test",
      graceEndsAtLabel: "Oct 30, 2026",
      nextRetryAtLabel: "Oct 24, 2026",
      dunningStepIndex: "0"
    });
    expect(dunning.subject).toBe("Action needed: your VIP payment didn't go through");
  });

  it("prefers Resend from address when email-first flag is on", () => {
    expect(
      resolveOutboundEmailFromAddress({
        resendEmailEnabled: true,
        resendFromEmail: "hello@renvani.test",
        sendgridFromEmail: "legacy@sendgrid.test"
      })
    ).toBe("hello@renvani.test");
  });
});
