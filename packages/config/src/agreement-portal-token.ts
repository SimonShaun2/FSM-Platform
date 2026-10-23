import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "./env.js";

function signingSecret(): string {
  return env.JWT_SECRET;
}

function encodePayload(companyId: string, agreementId: string): string {
  return `${companyId}:${agreementId}`;
}

export function signAgreementPortalToken(companyId: string, agreementId: string): string {
  const payload = encodePayload(companyId, agreementId);
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyAgreementPortalToken(
  token: string
): { companyId: string; agreementId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payload, signature] = parts;
  const expected = createHmac("sha256", signingSecret()).update(payload).digest("base64url");

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  const [companyId, agreementId] = payload.split(":");
  if (!companyId || !agreementId) {
    return null;
  }

  return { companyId, agreementId };
}

export function buildAgreementRetryPortalUrl(appBaseUrl: string, portalToken: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/portal/agreements/${portalToken}`;
}

export function buildInvoiceReceiptPortalUrl(appBaseUrl: string, paymentToken: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/pay/${paymentToken}/receipt`;
}
