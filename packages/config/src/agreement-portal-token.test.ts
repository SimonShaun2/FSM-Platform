import { describe, expect, it } from "vitest";

import { signAgreementPortalToken, verifyAgreementPortalToken } from "./agreement-portal-token.js";

describe("agreement-portal-token", () => {
  it("round-trips portal tokens", () => {
    const token = signAgreementPortalToken(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002"
    );
    const parsed = verifyAgreementPortalToken(token);
    expect(parsed).toEqual({
      companyId: "00000000-0000-4000-8000-000000000001",
      agreementId: "00000000-0000-4000-8000-000000000002"
    });
  });

  it("rejects tampered tokens", () => {
    const token = signAgreementPortalToken(
      "00000000-0000-4000-8000-000000000001",
      "00000000-0000-4000-8000-000000000002"
    );
    expect(verifyAgreementPortalToken(`${token}x`)).toBeNull();
  });
});
