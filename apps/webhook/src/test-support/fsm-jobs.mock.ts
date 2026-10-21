import { vi } from "vitest";

type NotificationsAddMock = ReturnType<typeof vi.fn>;

const globalJobsMockState = globalThis as {
  __fsmWebhookNotificationsQueueAddMock?: NotificationsAddMock;
};

/** One spy whether the module is loaded via `@fsm/jobs` (vitest alias) or a relative path. */
function getNotificationsQueueAddMock(): NotificationsAddMock {
  if (!globalJobsMockState.__fsmWebhookNotificationsQueueAddMock) {
    globalJobsMockState.__fsmWebhookNotificationsQueueAddMock = vi.fn();
  }

  return globalJobsMockState.__fsmWebhookNotificationsQueueAddMock;
}

export const notificationsQueueAddMock = getNotificationsQueueAddMock();

export const notificationsQueue = {
  add: notificationsQueueAddMock
};
