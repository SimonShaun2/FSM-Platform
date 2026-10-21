import { AppError, type BookingRequestStatus, ErrorCode } from "@fsm/types";

export const TERMINAL_BOOKING_STATUSES = new Set<BookingRequestStatus>([
  "confirmed",
  "cancelled",
  "completed",
  "no_show"
]);

export type NonTerminalBookingAction = "confirmed" | "held";

export function assertNonTerminalBookingRequest(
  status: BookingRequestStatus,
  action: NonTerminalBookingAction
): void {
  if (!TERMINAL_BOOKING_STATUSES.has(status)) {
    return;
  }

  const message =
    action === "confirmed"
      ? "Only pending booking requests can be confirmed"
      : "Only pending booking requests can hold a slot";

  throw new AppError(ErrorCode.CONFLICT, message);
}
