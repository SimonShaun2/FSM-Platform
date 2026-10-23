import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "./env.js";

function signingSecret(): string {
  return env.JWT_SECRET;
}

function encodePayload(companyId: string, customerId: string, vipTierId: string): string {
  return `${companyId}:${customerId}:${vipTierId}`;
}

export function signVipMembershipJoinToken(
  companyId: string,
  customerId: string,
  vipTierId: string
): string {
  const payload = encodePayload(companyId, customerId, vipTierId);
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyVipMembershipJoinToken(
  token: string
): { companyId: string; customerId: string; vipTierId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const payload = parts[0];
  const signature = parts[1];
  if (!payload || !signature) {
    return null;
  }

  const expected = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (sigBuffer.length !== expectedBuffer.length || !timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  const [companyId, customerId, vipTierId] = payload.split(":");
  if (!companyId || !customerId || !vipTierId) {
    return null;
  }

  return { companyId, customerId, vipTierId };
}

export function buildVipMembershipJoinUrl(appBaseUrl: string, joinToken: string): string {
  const base = appBaseUrl.replace(/\/$/, "");
  return `${base}/vip/join/${joinToken}`;
}
