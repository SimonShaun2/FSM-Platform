import jwt from "jsonwebtoken";
import { z } from "zod";

import { env } from "@fsm/config";
import { AppError, ErrorCode } from "@fsm/types";

/** Seven days — customer completes slot selection after submit. */
const BOOKING_HOLD_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const bookingHoldTokenPayloadSchema = z.object({
  companyId: z.string().uuid(),
  bookingRequestId: z.string().uuid(),
  referenceNumber: z.string().min(8),
  tokenType: z.literal("booking_hold")
});

export type BookingHoldTokenPayload = z.infer<typeof bookingHoldTokenPayloadSchema>;

export function generateBookingHoldToken(payload: Omit<BookingHoldTokenPayload, "tokenType">): string {
  return jwt.sign(
    {
      ...payload,
      tokenType: "booking_hold"
    },
    env.JWT_SECRET,
    { expiresIn: BOOKING_HOLD_TOKEN_TTL_SECONDS }
  );
}

export function verifyBookingHoldToken(token: string): BookingHoldTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return bookingHoldTokenPayloadSchema.parse(decoded);
  } catch {
    throw new AppError(ErrorCode.UNAUTHORIZED, "Invalid or expired booking hold token");
  }
}
