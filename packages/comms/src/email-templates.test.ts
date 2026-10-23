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
