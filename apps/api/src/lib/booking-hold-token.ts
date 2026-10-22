import { randomUUID } from "node:crypto";

import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "@fsm/config";
import { AppError, ErrorCode } from "@fsm/types";

import {
  claimBookingHoldTokenJti,
  releaseBookingHoldTokenJti
} from "./booking-hold-token-store.js";

/** Seven days — customer completes slot selection after submit. */
export const BOOKING_HOLD_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const bookingHoldTokenPayloadSchema = z.object({
  companyId: z.string().uuid(),
  bookingRequestId: z.string().uuid(),
  referenceNumber: z.string().min(8),
  jti: z.string().uuid(),
  tokenType: z.literal("booking_hold")
});

export type BookingHoldTokenPayload = z.infer<typeof bookingHoldTokenPayloadSchema>;

export function generateBookingHoldToken(payload: Omit<BookingHoldTokenPayload, "tokenType" | "jti">): string {
  return jwt.sign(
    {
      ...payload,
      jti: randomUUID(),
      tokenType: "booking_hold"
    },
    env.BOOKING_HOLD_TOKEN_SECRET,
    { expiresIn: BOOKING_HOLD_TOKEN_TTL_SECONDS }
  );
}

export function verifyBookingHoldToken(token: string): BookingHoldTokenPayload {
  try {
    const decoded = jwt.verify(token, env.BOOKING_HOLD_TOKEN_SECRET);
    return bookingHoldTokenPayloadSchema.parse(decoded);
  } catch {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired booking hold token");
  }
}

function shouldReleaseHoldTokenClaim(error: unknown): boolean {
  if (!(error instanceof AppError)) {
    return true;
  }

  return (
    error.code === ErrorCode.CONFLICT ||
    error.code === ErrorCode.VALIDATION_ERROR ||
    error.code === ErrorCode.INTERNAL_ERROR ||
    error.code === ErrorCode.NOT_FOUND
  );
}

export async function verifyAndClaimBookingHoldToken(token: string): Promise<BookingHoldTokenPayload> {
  const claims = verifyBookingHoldToken(token);
  const claimed = await claimBookingHoldTokenJti(claims.jti, BOOKING_HOLD_TOKEN_TTL_SECONDS);

  if (!claimed) {
    throw new AppError(ErrorCode.CONFLICT, "Booking hold token has already been used");
  }

  return claims;
}

export async function finalizeBookingHoldTokenClaim(
  claims: BookingHoldTokenPayload,
  error: unknown
): Promise<void> {
  if (shouldReleaseHoldTokenClaim(error)) {
    await releaseBookingHoldTokenJti(claims.jti);
  }
}
