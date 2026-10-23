import { afterEach, describe, expect, it, vi } from "vitest";

import { createResendEmailChannel } from "./resend-email.adapter.js";

describe("createResendEmailChannel", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts to Resend and returns the provider message id", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id: "msg_abc123" })
    }));
    vi.stubGlobal("fetch", fetchMock);

    const channel = createResendEmailChannel({
      apiKey: "re_test_key",
      defaultFrom: "hello@renvani.test"
    });

    const result = await channel.sendTransactionalEmail({
      to: "customer@example.com",
      subject: "Hello",
      html: "<p>Hi</p>",
      text: "Hi",
      tags: ["invoice.sent"]
    });

    expect(result.providerMessageId).toBe("msg_abc123");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer re_test_key"
        })
      })
    );
  });

  it("throws when Resend returns a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        text: async () => "validation_error"
      }))
    );

    const channel = createResendEmailChannel({
      apiKey: "re_test_key",
      defaultFrom: "hello@renvani.test"
    });

    await expect(
      channel.sendTransactionalEmail({
        to: "bad",
        subject: "x",
        html: "x"
      })
    ).rejects.toThrow(/Resend send failed \(422\)/);
  });
});
