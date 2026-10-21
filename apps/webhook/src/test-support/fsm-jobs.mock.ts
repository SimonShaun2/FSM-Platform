import { vi } from "vitest";

/** Shared by stripe.handler tests — resolved via vitest alias instead of vi.mock. */
export const notificationsQueueAddMock = vi.fn();

export const notificationsQueue = {
  add: notificationsQueueAddMock
};
