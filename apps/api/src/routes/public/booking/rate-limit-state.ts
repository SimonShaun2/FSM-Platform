const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export const bookingRequestTimesByIp = new Map<string, number[]>();
export const slotHoldTimesByReference = new Map<string, number[]>();

export function resetPublicBookingRateLimitStateForTests(): void {
  bookingRequestTimesByIp.clear();
  slotHoldTimesByReference.clear();
}

export function getRateLimitWindowMs(): number {
  return RATE_LIMIT_WINDOW_MS;
}
