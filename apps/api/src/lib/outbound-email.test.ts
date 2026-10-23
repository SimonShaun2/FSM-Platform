import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sgSendMock = vi.hoisted(() => vi.fn());

vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: sgSendMock
  }
}));

vi.mock("@fsm/config", () => ({
  env: {
    RESEND_API_KEY: "",
    RESEND_FROM_EMAIL: "",
    SENDGRID_API_KEY: "sg_key",
    SENDGRID_FROM_EMAIL: "legacy@sendgrid.test"
  }
}));

vi.mock("@fsm/config/feature-flags", () => ({
  featureFlags: {
    resendEmailEnabled: false
  }
}));

describe("deliverTransactionalEmail", () => {
  beforeEach(() => {
    sgSendMock.mockReset();
    sgSendMock.mockResolvedValue(undefined);
    vi.unstubAllGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses SendGrid when resend flag is off", async () => {
    const { deliverTransactionalEmail } = await import("./outbound-email.js");

    await deliverTransactionalEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>"
    });

    expect(sgSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        from: "legacy@sendgrid.test"
      })
    );
  });

  it("uses Resend when resend flag is on and credentials are set", async () => {
    vi.resetModules();
    vi.doMock("@fsm/config", () => ({
      env: {
        RESEND_API_KEY: "re_live",
        RESEND_FROM_EMAIL: "hello@renvani.test",
        SENDGRID_API_KEY: "sg_key",
        SENDGRID_FROM_EMAIL: "legacy@sendgrid.test"
      }
    }));
    vi.doMock("@fsm/config/feature-flags", () => ({
      featureFlags: {
        resendEmailEnabled: true
      }
    }));

    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "msg_resend" })
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { deliverTransactionalEmail } = await import("./outbound-email.js");

    const result = await deliverTransactionalEmail({
      to: "user@example.com",
      subject: "Test",
      html: "<p>Test</p>"
    });

    expect(result.providerMessageId).toBe("msg_resend");
    expect(fetchMock).toHaveBeenCalled();
    expect(sgSendMock).not.toHaveBeenCalled();
  });
});
